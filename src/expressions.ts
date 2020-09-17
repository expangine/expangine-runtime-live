
import { ConstantExpression, GetExpression, OperationExpression, ChainExpression, 
  IfExpression, NotExpression, AndExpression, OrExpression, ForExpression, 
  WhileExpression, DefineExpression, SwitchExpression, SetExpression, 
  DoExpression, TemplateExpression, UpdateExpression, InvokeExpression, 
  ReturnExpression, NoExpression, TupleExpression, ObjectExpression, SubExpression,
  ComputedExpression, GetEntityExpression, GetRelationExpression, CommentExpression,
  GetDataExpression, MethodExpression, isUndefined, objectMap, PathExpression, Expression } from 'expangine-runtime';
import { preserveScope } from './helper';
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

  function shouldReturn(provider: LiveProvider, context: LiveContext)
  {
    return run.dataHas(context, provider.returnProperty);
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
      if (shouldReturn(provider, context)) return;

      const { end, value } = traverser(context);

      return end ? value : false;
    };
  });

  run.setExpression(SetExpression, (expr, provider) => 
  {
    const traverser = getPathTraverser(provider, expr.path);
    const getValue: LiveCommand = provider.getCommand(expr.value);

    return (context) => 
    {
      if (shouldReturn(provider, context)) return;

      const { end, previous, step } = traverser(context);

      if (end) 
      {
        return run.dataSet(previous, step, getValue(context));
      }

      return false;
    };
  });

  run.setExpression(UpdateExpression, (expr, provider) => 
  {
    const traverser = getPathTraverser(provider, expr.path);
    const getValue: LiveCommand = provider.getCommand(expr.value);
    const currentVariable: string = expr.currentVariable;

    return (context) => 
    {
      if (shouldReturn(provider, context)) return;
      
      const { end, previous, step, value } = traverser(context);

      if (end)
      {
        return preserveScope(run, context, [currentVariable], () => 
        {
          run.dataSet(context, currentVariable, value);
        
          return run.dataSet(previous, step, getValue(context));
        });
      }

      return false;
    };
  });

  run.setExpression(SubExpression, (expr, provider) => 
  {
    throw new Error('SubExpression is no longer supported.');
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
      if (shouldReturn(provider, context)) return;

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

    const operationCommand = op(params, scopeAlias);

    return (context) =>
    {
      if (shouldReturn(provider, context)) return;

      return operationCommand(context);
    };
  });

  run.setExpression(ChainExpression, (expr, provider) => 
  { 
    const chain: LiveCommand[] = expr.chain.map(data => provider.getCommand(data));

    return (context) => 
    {
      if (shouldReturn(provider, context)) return;

      let last;

      for (const cmd of chain)
      {
        last = cmd(context);

        if (shouldReturn(provider, context)) return;
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
      if (shouldReturn(provider, context)) return;

      for (const caseExpression of cases)
      {
        const [test, result] = caseExpression;

        if (test(context)) 
        {
          return shouldReturn(provider, context)
            ? undefined
            : result(context);
        }
      }
      
      if (shouldReturn(provider, context)) return;

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
      if (shouldReturn(provider, context)) return;

      const value = valueCommand(context);

      if (shouldReturn(provider, context)) return;

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

          if (shouldReturn(provider, context)) return;
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
      if (shouldReturn(provider, context)) return;

      for (const and of expressions)
      {
        if (!and(context) || shouldReturn(provider, context))
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
      if (shouldReturn(provider, context)) return;

      for (const or of expressions)
      {
        const pass = or(context);

        if (pass || shouldReturn(provider, context))
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
    const body: LiveCommand = provider.getCommand(expr.body);
    const breakVariable: string = expr.breakVariable;
    const max: number = expr.maxIterations;

    return (context) => 
    {
      if (shouldReturn(provider, context)) return;

      return preserveScope(run, context, [variable, breakVariable], () => 
      {
        run.dataSet(context, breakVariable, false);

        let i = start(context);
        let iterations = 0;
        let stop = end(context);
        let last;
        const dir = i < stop ? 1 : -1;

        if (shouldReturn(provider, context)) return;

        while ((dir === 1 ? i < stop : i > stop) && iterations++ < max) 
        {
          run.dataSet(context, variable, i);
          last = body(context);

          if (run.dataGet(context, breakVariable) || shouldReturn(provider, context))
          {
            break;
          }

          i += dir;
          stop = end(context);

          if (shouldReturn(provider, context)) return;
        }

        return last;
      });
    };
  });

  run.setExpression(WhileExpression, (expr, provider) => 
  {
    const condition: LiveCommand = provider.getCommand(expr.condition);
    const body: LiveCommand = provider.getCommand(expr.body);
    const breakVariable: string = expr.breakVariable;
    const max: number = expr.maxIterations;

    return (context) => 
    {
      if (shouldReturn(provider, context)) return;

      return preserveScope(run, context, [breakVariable], () =>
      {
        let iterations = 0;
        let last;

        run.dataSet(context, breakVariable, false);

        while (condition(context) && iterations++ < max)
        {
          if (shouldReturn(provider, context)) return;

          last = body(context);

          if (run.dataGet(context, breakVariable) || shouldReturn(provider, context))
          {
            break;
          }
        }

        return last;
      });
    };
  });

  run.setExpression(DoExpression, (expr, provider) => 
  {
    const condition: LiveCommand = provider.getCommand(expr.condition);
    const body: LiveCommand = provider.getCommand(expr.body);
    const breakVariable: string = expr.breakVariable;
    const max: number = expr.maxIterations;

    return (context) => 
    {
      if (shouldReturn(provider, context)) return;

      return preserveScope(run, context, [breakVariable], () =>
      {
        let iterations = 0;
        let last;

        run.dataSet(context, breakVariable, false);

        do
        {
          if (shouldReturn(provider, context)) return;

          last = body(context);

          if (run.dataGet(context, breakVariable) || shouldReturn(provider, context))
          {
            break;
          }

        } while(condition(context) && iterations++ < max);

        return last;
      });
    };
  });

  run.setExpression(DefineExpression, (expr, provider) => 
  {
    const define: [string, LiveCommand][] = expr.define.map(([name, e]) => [name, provider.getCommand(e)]);
    const vars: string[] = define.map(([name]) => name);
    const body: LiveCommand = provider.getCommand(expr.body);

    return (context) =>
    {
      if (shouldReturn(provider, context)) return;

      return preserveScope(run, context, vars, () =>
      {
        for (const [name, defined] of define)
        {
          if (shouldReturn(provider, context)) return;
          
          run.dataSet(context, name, defined(context));
        }

        if (shouldReturn(provider, context)) return;

        return body(context);
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
      const source = objectMap(params, p => p(context));

      return sections.reduce((out, section) => out + section(source), '');
    };
  });

  run.setExpression(InvokeExpression, (expr, provider) =>
  {
    const func = provider.getFunction(expr.name);
    const command = provider.getCommand(func.expression);
    const args = objectMap(expr.args, a => provider.getCommand(a));

    return (context) => 
    {
      if (shouldReturn(provider, context)) return;

      const params = objectMap(args, a => a(context));
      const funcContext = func.getArguments(params, false);

      command(funcContext);

      return run.dataGet(funcContext, provider.returnProperty);
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
      if (shouldReturn(provider, context)) return;

      const params = objectMap(args, a => a(context));
      const funcContext = method.getArguments(params, false);

      funcContext[Expression.INSTANCE] = parent;

      command(funcContext);

      return run.dataGet(funcContext, provider.returnProperty);
    };
  });

  run.setExpression(ReturnExpression, (expr, provider) =>
  {
    const returnValue = provider.getCommand(expr.value);

    return (context) => 
    {
      const result = returnValue(context);

      run.dataSet(context, provider.returnProperty, result);

      return result;
    };
  });

  run.setExpression(TupleExpression, (expr, provider) =>
  {
    const elements: LiveCommand[] = expr.expressions.map(e => provider.getCommand(e));

    return (context) => elements.map(cmd => cmd(context));
  });

  run.setExpression(ObjectExpression, (expr, provider) =>
  {
    const props: LiveCommandMap = objectMap(expr.props, e => provider.getCommand(e));

    return (context) => objectMap(props, cmd => cmd(context));
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