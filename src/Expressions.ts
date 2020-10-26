
import { ConstantExpression, GetExpression, OperationExpression, ChainExpression, 
  IfExpression, NotExpression, AndExpression, OrExpression, ForExpression, 
  WhileExpression, DefineExpression, SwitchExpression, SetExpression, 
  DoExpression, TemplateExpression, InvokeExpression, 
  FlowExpression, NoExpression, TupleExpression, ObjectExpression,
  ComputedExpression, GetEntityExpression, GetRelationExpression, CommentExpression,
  GetDataExpression, MethodExpression, isUndefined, objectMap, PathExpression, Expression, 
  AssertExpression, FlowType, isObject } from 'expangine-runtime';
import { _number } from './helper';
import { LiveCommand, LiveCommandMap, LiveRuntimeImpl, LiveProvider, LiveContext } from './LiveRuntime';


export default function(run: LiveRuntimeImpl)
{

  function getPathTraverser(provider: LiveProvider, path: PathExpression)
  {
    const exprs: Expression[] = path.expressions;
    const nodes: LiveCommand[] = exprs.map((node) => provider.getCommand(node));
    const contextual = exprs.map((node, index) => index === 0 || node.isPathNode());
    const last = nodes.length - 1;

    return (context: LiveContext) =>
    {
      let value = context;
      let previous;
      let step;
      let end = true;

      for (let i = 0; i <= last && !isUndefined(value); i++) 
      {
        step = nodes[i](context, value);

        if (run.flowChange(context, provider))
        {
          end = false;
          break;
        }

        previous = value;
      
        const next = contextual[i]
          ? step
          : run.dataGet(value, step);

        if (isUndefined(next) && i !== last) 
        {
          end = false;
        }

        value = next;
      }

      return { end, previous, step, value };
    };
  }

  run.setExpression(ConstantExpression, (expr, provider) => 
  {
    return () => run.dataCopy(expr.value)
  });

  run.setExpression(PathExpression, (expr, provider) => 
  {
    const traverser = getPathTraverser(provider, expr);
    
    return (context) => 
    {
      const { end, value } = traverser(context);

      return end ? value : false;
    };
  });

  run.setExpression(SetExpression, (expr, provider) => 
  {
    const traverser = getPathTraverser(provider, expr.path);
    const getValue: LiveCommand = provider.getCommand(expr.value);
    const currentVariable: string = expr.currentVariable;

    if (currentVariable)
    {
      return (context) => 
      {
        const { end, previous, step, value } = traverser(context);

        if (end)
        {
          return run.enterScope(context, [currentVariable], (inner) => 
          {
            run.dataSet(inner, currentVariable, value);

            const newValue = getValue(inner);

            if (run.flowChange(context, provider))
            {
              return;
            }
          
            return run.dataSet(previous, step, newValue);
          });
        }

        return false;
      };
    }
    else
    {
      return (context) => 
      {
        const { end, previous, step } = traverser(context);

        if (end) 
        {
          const newValue = getValue(context);

          if (run.flowChange(context, provider))
          {
            return;
          }
          
          return run.dataSet(previous, step, newValue);
        }

        return false;
      };
    }
  });

  run.setExpression(ComputedExpression, (expr, provider) =>
  {
    const comp = provider.getComputed(expr.name);

    if (!comp)
    {
      throw new Error(`Computed ${expr.name} is not defined in the given runtime.`);
    }

    const op = provider.getOperation(comp.op);
    const params: LiveCommandMap = objectMap(comp.params, (constant) => () => constant);

    return (context, parent) =>
    {
      params[comp.value] = () => parent;

      const operationCommand = op(params, {});

      return operationCommand(context);
    };
  });

  run.setExpression(OperationExpression, (expr, provider) => 
  {
    const params: LiveCommandMap = objectMap(expr.params, e => provider.getCommand(e));
    const op = provider.getOperation(expr.name);

    if (!op) 
    { 
      throw new Error(`Operation with ${expr.name} is not defined in the given runtime.`);
    }
    
    const defaults = provider.getOperationScopeDefaults(expr.name);
    let scopeAlias = expr.scopeAlias;

    if (defaults) 
    {
      for (const prop in defaults) 
      {
        if (!(prop in scopeAlias)) 
        { 
          if (scopeAlias === expr.scopeAlias) 
          {
            scopeAlias = { ...scopeAlias };
          }

          scopeAlias[prop] = defaults[prop];
        }
      }
    }

    return op(params, scopeAlias);
  });

  run.setExpression(ChainExpression, (expr, provider) => 
  { 
    const chain: LiveCommand[] = expr.chain.map(data => provider.getCommand(data));

    return (context) => 
    {
      let last;

      for (const cmd of chain)
      {
        last = cmd(context);

        if (run.flowChange(context, provider)) return;
      }

      return last;
    };
  });

  run.setExpression(IfExpression, (expr, provider) => 
  {
    const cases: [LiveCommand, LiveCommand][] = expr.cases.map(([test, result]) => [provider.getCommand(test), provider.getCommand(result)]);
    const otherwise: LiveCommand = provider.getCommand(expr.otherwise);

    return (context) => 
    {
      for (const caseExpression of cases)
      {
        const [test, result] = caseExpression;

        if (test(context)) 
        {
          return run.flowChange(context, provider)
            ? undefined
            : result(context);
        }
      }

      return otherwise(context);
    };
  });

  run.setExpression(SwitchExpression, (expr, provider) => 
  {
    const valueCommand: LiveCommand = provider.getCommand(expr.value);
    const cases: [LiveCommand[], LiveCommand][] = expr.cases.map(([tests, result]) => [
      tests.map(t => provider.getCommand(t)),
      provider.getCommand(result)
    ]);
    const defaultCase: LiveCommand = provider.getCommand(expr.defaultCase);
    const isEqual = provider.getOperation(expr.op);
    const noScope = {};
    
    return (context) => 
    {
      const value = valueCommand(context);

      if (run.flowChange(context, provider)) return;

      for (const [tests, result] of cases)
      {
        let matches = false;

        for (const test of tests) 
        { 
          if (isEqual({ value: () => value, test }, noScope)(context)) 
          {
            matches = true;
            break;
          }

          if (run.flowChange(context, provider)) return;
        }

        if (matches) 
        {
          return result(context);
        }
      }

      return defaultCase(context);
    };
  });

  run.setExpression(NotExpression, (expr, provider) => 
  {
    const expression: LiveCommand = provider.getCommand(expr.expression);

    return (context) => !expression(context);
  });

  run.setExpression(AndExpression, (expr, provider) => 
  {
    const expressions: LiveCommand[] = expr.expressions.map(e => provider.getCommand(e));
    const defaultResult: boolean = expressions.length > 0;

    return (context) => 
    {
      for (const and of expressions)
      {
        if (!and(context) || run.flowChange(context, provider))
        {
          return false;
        }
      }

      return defaultResult;
    };
  });

  run.setExpression(OrExpression, (expr, provider) => 
  {
    const expressions: LiveCommand[] = expr.expressions.map(e => provider.getCommand(e));
    const defaultResult: boolean = expressions.length === 0;

    return (context) => 
    {
      for (const or of expressions)
      {
        const pass = or(context);

        if (pass || run.flowChange(context, provider))
        {
          return pass;
        }
      }

      return defaultResult;
    };
  });

  run.setExpression(ForExpression, (expr, provider) => 
  {
    const variable: string = expr.variable;
    const start: LiveCommand = provider.getCommand(expr.start);
    const end: LiveCommand = provider.getCommand(expr.end);
    const endDynamic: boolean = expr.end.isDynamic();
    const by: LiveCommand = provider.getCommand(expr.by);
    const byDynamic: boolean = expr.by.isDynamic();
    const body: LiveCommand = provider.getCommand(expr.body);
    const max: number = expr.maxIterations;

    return (context) => 
    {
      return run.enterScope(context, [variable], (inner) => 
      {
        let i = start(inner);
        let iterations = 0;
        let stop = end(inner);
        const dir = i < stop ? 1 : -1;
        let amount = byDynamic ? dir : dir * Math.abs(_number(by, inner, 1));
        let last;

        if (run.flowChange(inner, provider)) return;

        while ((dir === 1 ? i < stop : i > stop) && iterations++ < max) 
        {
          run.dataSet(inner, variable, i);
          last = body(inner);

          const flow = run.flowChange(inner, provider);

          if (flow === FlowType.CONTINUE) {
            run.flowClear(context, provider);
          } else if (flow === FlowType.BREAK) {
            run.flowClear(context, provider);
            break;
          } else if (flow) {
            return;
          }

          if (byDynamic) {
            amount = dir * Math.abs(_number(by, inner, 1));

            if (run.flowChange(inner, provider)) return;
          }

          if (endDynamic) {
            stop = end(inner);

            if (run.flowChange(inner, provider)) return;
          }

          i += amount;
        }

        return last;
      });
    };
  });

  run.setExpression(WhileExpression, (expr, provider) => 
  {
    const condition: LiveCommand = provider.getCommand(expr.condition);
    const body: LiveCommand = provider.getCommand(expr.body);
    const max: number = expr.maxIterations;

    return (context) => 
    {
      let iterations = 0;
      let last;

      while (condition(context) && iterations++ < max)
      {
        const flowCondition = run.flowChange(context, provider);

        if (flowCondition === FlowType.CONTINUE) {
          run.flowClear(context, provider);
          continue;
        } else if (flowCondition === FlowType.BREAK) {
          run.flowClear(context, provider);
          break;
        } else if (flowCondition) {
          return;
        }

        last = body(context);

        const flowBody = run.flowChange(context, provider);

        if (flowBody === FlowType.CONTINUE) {
          run.flowClear(context, provider);
        } else if (flowBody === FlowType.BREAK) {
          run.flowClear(context, provider);
          break;
        } else if (flowBody) {
          return;
        }
      }

      return last;
    };
  });

  run.setExpression(DoExpression, (expr, provider) => 
  {
    const condition: LiveCommand = provider.getCommand(expr.condition);
    const body: LiveCommand = provider.getCommand(expr.body);
    const max: number = expr.maxIterations;

    return (context) => 
    {
      let iterations = 0;
      let last;

      do
      {
        const flowCondition = run.flowChange(context, provider);

        if (flowCondition === FlowType.CONTINUE) {
          run.flowClear(context, provider);
          continue;
        } else if (flowCondition === FlowType.BREAK) {
          run.flowClear(context, provider);
          break;
        } else if (flowCondition) {
          return;
        }

        last = body(context);

        const flowBody = run.flowChange(context, provider);

        if (flowBody === FlowType.CONTINUE) {
          run.flowClear(context, provider);
        } else if (flowBody === FlowType.BREAK) {
          run.flowClear(context, provider);
          break;
        } else if (flowBody) {
          return;
        }

      } while(condition(context) && iterations++ < max);

      return last;
    };
  });

  run.setExpression(DefineExpression, (expr, provider) => 
  {
    const define: [string | Record<string, string | number>, LiveCommand][] = expr.define.map(([name, e]) => [name, provider.getCommand(e)]);
    const vars: string[] = [];
    const body: LiveCommand = provider.getCommand(expr.body);

    define.forEach(([name]) => 
    {
      if (isObject(name))
      {
        for (const prop in name) vars.push(prop);
      }
      else
      {
        vars.push(name);
      }
    });

    return (context) =>
    {
      return run.enterScope(context, vars, (inner) =>
      {
        for (const [name, defined] of define)
        { 
          const definedValue = defined(inner);

          if (isObject(name))
          {
            if (definedValue)
            {
              for (const prop in name)
              {
                run.dataSet(inner, prop, definedValue[name[prop]]);
              }
            }
          }
          else
          {
            run.dataSet(inner, name, definedValue);
          }

          if (run.flowChange(inner, provider)) return;
        }

        return body(inner);
      });
    };
  });

  run.setExpression(TemplateExpression, (expr, provider) => 
  {
    const SECTION_TYPES = 2;
    const SECTION_INDEX_CONSTANT = 0;

    const params: LiveCommandMap = objectMap(expr.params, e => provider.getCommand(e));
    const template: string = expr.template;

    const sections = template.split(/[\{\}]/).map((section, index) => {
      return index % SECTION_TYPES === SECTION_INDEX_CONSTANT
        ? (_source: any) => section
        : (source: any) => source && section in source ? source[section] : '';
    });

    return (context) =>
    {
      const source = run.getCommandMap(context, params, provider);

      return source
        ? sections.reduce((out, section) => out + section(source), '')
        : undefined;
    };
  });

  run.setExpression(InvokeExpression, (expr, provider) =>
  {
    const func = provider.getFunction(expr.name);
    const command = provider.getCommand(func.expression);
    const args = objectMap(expr.args, a => provider.getCommand(a));

    return (context) => 
    {
      const params = run.getCommandMap(context, args, provider);

      if (!params)
      {
        return;
      }

      const funcContext = func.getArguments(params, false);

      command(funcContext);

      const [type, result] = run.dataGet(funcContext, provider.flowProperty);

      if (type === FlowType.EXIT)
      {
        run.dataSet(context, provider.flowProperty, [type, result]);
      }

      return result;
    };
  });

  run.setExpression(MethodExpression, (expr, provider) =>
  {
    const entity = run.defs.getEntity(expr.entity);

    if (!entity)
    {
      throw new Error(`Entity ${expr.entity} does not exist.`);
    }

    const method = entity.methods[expr.name];

    if (!method)
    {
      throw new Error(`Method ${expr.name} in entity ${expr.entity} does not exist.`);
    }

    const command = provider.getCommand(method.expression);
    const args = objectMap(expr.args, a => provider.getCommand(a));

    return (context, parent) => 
    {
      const params = run.getCommandMap(context, args, provider);

      if (!params) 
      {
        return;
      }

      const funcContext = method.getArguments(params, false);

      funcContext[Expression.INSTANCE] = parent;

      command(funcContext);

      const [type, result] = run.dataGet(funcContext, provider.flowProperty);

      if (type === FlowType.EXIT)
      {
        run.dataSet(context, provider.flowProperty, [type, result]);
      }

      return result;
    };
  });

  run.setExpression(FlowExpression, (expr, provider) =>
  {
    const returnValue = provider.getCommand(expr.value);

    return (context) => 
    {
      const result = returnValue(context);

      run.dataSet(context, provider.flowProperty, [expr.type, result]);

      return result;
    };
  });

  run.setExpression(AssertExpression, (expr, provider) => 
  {
    const condition: LiveCommand = provider.getCommand(expr.condition);
    const message: LiveCommand = provider.getCommand(expr.message);

    return (context) => 
    {
      if (!condition(context))
      {
        run.dataSet(context, provider.flowProperty, [FlowType.EXIT, message(context)]);
      }
    };
  });

  run.setExpression(TupleExpression, (expr, provider) =>
  {
    const elements: LiveCommand[] = expr.expressions.map(e => provider.getCommand(e));

    return (context) => 
    {
      const tuple = [];

      for (const element of elements) 
      {
        tuple.push(element(context));

        if (run.flowChange(context, provider))
        {
          return;
        }
      }

      return tuple;
    };
  });

  run.setExpression(ObjectExpression, (expr, provider) =>
  {
    const props: LiveCommandMap = objectMap(expr.props, e => provider.getCommand(e));

    return (context) => run.getCommandMap(context, props, provider);
  });

  run.setExpression(NoExpression, () => () => undefined);

  run.setExpression(CommentExpression, () => () => undefined);

  run.setExpression(GetExpression, () => (context) => context);

  run.setExpression(GetEntityExpression, (expr) => () => expr.name);

  run.setExpression(GetRelationExpression, (expr) => () => expr.name);

  run.setExpression(GetDataExpression, (expr) => () => 
  {
    const data = run.defs.getData(expr.name);

    return data === null ? data : data.data;
  });

}