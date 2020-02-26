
import { ConstantExpression, GetExpression, OperationExpression, ChainExpression, 
  IfExpression, NotExpression, AndExpression, OrExpression, ForExpression, 
  WhileExpression, DefineExpression, SwitchExpression, SetExpression, 
  DoExpression, TemplateExpression, UpdateExpression, InvokeExpression, 
  ReturnExpression, NoExpression, TupleExpression, ObjectExpression, SubExpression,
  ComputedExpression, GetEntityExpression, GetRelationExpression, CommentExpression,
  GetDataExpression, isUndefined, objectMap, isObject, isArray, isString, copy } from 'expangine-runtime';
import { preserveScope } from './helper';
import { LiveCommand, LiveCommandMap, LiveRuntimeImpl } from './LiveRuntime';


export default function(run: LiveRuntimeImpl)
{

  function traversePath(context: any, value: any, path: LiveCommand[])
  {
    const end = path.length - 1;
    let previous;
    let step;

    for (let i = 0; i <= end && !isUndefined(value); i++) 
    {
      step = path[i](context);
      previous = value;

      const next = value instanceof Map
        ? value.get(step)
        : value === null
          ? undefined
          : value[step];

      if (isUndefined(next) && i !== end) 
      {
        return { end: false, previous, step, value: undefined };
      }

      value = next;
    }

    return { end: true, previous, step, value };
  }

  run.setExpression(ConstantExpression, (expr, provider) => 
  {
    return () => copy(expr.value)
  });

  run.setExpression(GetExpression, (expr, provider) => 
  {
    const parts: LiveCommand[] = expr.path.map(sub => provider.getCommand(sub));

    return (context) => traversePath(context, context, parts).value;
  });

  run.setExpression(SetExpression, (expr, provider) => 
  {
    const parts: LiveCommand[] = expr.path.map(sub => provider.getCommand(sub));
    const getValue: LiveCommand = provider.getCommand(expr.value);

    return (context) => 
    {
      const { end, previous, step } = traversePath(context, context, parts);

      if (end) 
      {
        if (previous instanceof Map)
        {
          previous.set(step, getValue(context));
        }
        else if (isArray(previous))
        {
          run.arraySet(previous, step, getValue(context));
        }
        else if (isString(previous) || isObject(previous))
        {
          run.objectSet(previous, step, getValue(context));
        }
        else
        {
          return false;
        }

        return true;
      }

      return false;
    };
  });

  run.setExpression(UpdateExpression, (expr, provider) => 
  {
    const parts: LiveCommand[] = expr.path.map(sub => provider.getCommand(sub));
    const getValue: LiveCommand = provider.getCommand(expr.value);
    const currentVariable: string = expr.currentVariable;

    return (context) => 
    {
      const { end, previous, step, value } = traversePath(context, context, parts);

      if (end)
      {
        return preserveScope(context, [currentVariable], () => 
        {
          context[currentVariable] = value;
        
          if (previous instanceof Map)
          {
            previous.set(step, getValue(context));
          }
          else if (isArray(previous))
          {
            run.arraySet(previous, step, getValue(context));
          }
          else if (isString(previous) || isObject(previous))
          {
            run.objectSet(previous, step, getValue(context));
          }
          else
          {
            return false;
          }

          return true;
        });
      }

      return false;
    };
  });

  run.setExpression(SubExpression, (expr, provider) => 
  {
    const getValue: LiveCommand = provider.getCommand(expr.value);
    const parts: LiveCommand[] = expr.path.map(sub => provider.getCommand(sub));

    return (context) => traversePath(context, getValue(context), parts).value;
  });

  run.setExpression(ComputedExpression, (expr, provider) =>
  {
    const comp = provider.getComputed(expr.name);

    if (!comp)
    {
      throw new Error(`Computed ${expr.name} is not defined in the given runtime.`);
    }

    const op = provider.getOperation(comp.op);
    const params: LiveCommandMap = {
      ...objectMap(comp.params, (constant) => () => constant),
      [comp.value]: provider.getCommand(expr.expression),
    };

    const operationCommand = op(params, {});
    
    return (context) =>
    {
      if (provider.returnProperty in context) return;

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
      if (provider.returnProperty in context) return;

      return operationCommand(context);
    };
  });

  run.setExpression(ChainExpression, (expr, provider) => 
  { 
    const chain: LiveCommand[] = expr.chain.map(data => provider.getCommand(data));

    return (context) => 
    {
      if (provider.returnProperty in context) return;

      let last;

      for (const cmd of chain)
      {
        last = cmd(context);

        if (provider.returnProperty in context)
        {
          return;
        }
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
      if (provider.returnProperty in context) return;

      for (const caseExpression of cases)
      {
        const [test, result] = caseExpression;

        if (test(context)) 
        {
          return provider.returnProperty in context
            ? undefined
            : result(context);
        }
      }
      
      if (provider.returnProperty in context) return;

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
      if (provider.returnProperty in context) return;

      const value = valueCommand(context);

      if (provider.returnProperty in context) return;

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

          if (provider.returnProperty in context) return;
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
      if (provider.returnProperty in context) return;

      for (const and of expressions)
      {
        if (!and(context) || provider.returnProperty in context)
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
      if (provider.returnProperty in context) return;

      for (const or of expressions)
      {
        const pass = or(context);

        if (pass || provider.returnProperty in context)
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
      if (provider.returnProperty in context) return;

      return preserveScope(context, [variable, breakVariable], () => 
      {
        context[breakVariable] = false;

        let i = start(context);
        let iterations = 0;
        let stop = end(context);
        let last;
        const dir = i < stop ? 1 : -1;

        if (provider.returnProperty in context)
        {
          return;
        }

        while ((dir === 1 ? i < stop : i > stop) && iterations++ < max) 
        {
          context[variable] = i;
          last = body(context);

          if (context[breakVariable] || provider.returnProperty in context) 
          {
            break;
          }

          i += dir;
          stop = end(context);

          if (provider.returnProperty in context) return;
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
      if (provider.returnProperty in context) return;

      return preserveScope(context, [breakVariable], () =>
      {
        let iterations = 0;
        let last;

        context[breakVariable] = false;

        while (condition(context) && iterations++ < max)
        {
          if (provider.returnProperty in context) return;

          last = body(context);

          if (context[breakVariable] || provider.returnProperty in context) 
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
      if (provider.returnProperty in context) return;

      return preserveScope(context, [breakVariable], () =>
      {
        let iterations = 0;
        let last;

        context[breakVariable] = false;

        do
        {
          if (provider.returnProperty in context) return;

          last = body(context);

          if (context[breakVariable] || provider.returnProperty in context) 
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
      if (provider.returnProperty in context) return;

      return preserveScope(context, vars, () =>
      {
        for (const [name, defined] of define)
        {
          if (provider.returnProperty in context)
          {
            return;
          }

          context[name] = defined(context);
        }

        if (provider.returnProperty in context)
        {
          return;
        }

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
      if (provider.returnProperty in context) return;

      const params = objectMap(args, a => a(context));
      const funcContext = func.getArguments(params, false);

      command(funcContext);

      return funcContext[provider.returnProperty];
    };
  });

  run.setExpression(ReturnExpression, (expr, provider) =>
  {
    const returnValue = provider.getCommand(expr.value);

    return (context) => context[provider.returnProperty] = returnValue(context);
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

  run.setExpression(GetEntityExpression, (expr) => () => expr.name);

  run.setExpression(GetRelationExpression, (expr) => () => expr.name);

  run.setExpression(GetDataExpression, (expr) => () => {
    const data = run.defs.getData(expr.name);

    return data === null ? data : data.data;
  });

}