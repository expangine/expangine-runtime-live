import { AliasedOps, TypeRelation, RelationTypeKey, compare, isArray, ListType, RelationCascade } from 'expangine-runtime';
import { LiveRuntimeImpl, LiveCommandMap, LiveContext } from './LiveRuntime';


export default function(run: LiveRuntimeImpl)
{
  const ops = AliasedOps;

  function getInstances<R>(name: string): Record<string, any>
  {
    if (!(name in run.instances)) 
    {
      run.objectSet(run.instances, name, {});
    }

    return run.instances[name];
  }

  function getKey(name: string, instance: any) 
  {
    if (!name) 
    {
      if (run.strict) 
      {
        throw new Error('A key could not be determined without a type name.');
      }

      return;
    }

    if (!instance) 
    {
      if (run.strict) 
      {
        throw new Error(`A key for ${name} could not be determined for a null instance.`);
      }

      return;
    }

    const storage = run.defs.storage[name];

    if (!storage) 
    {
      if (run.strict) 
      {
        throw new Error(`A key for ${name} could not be determined, no storage exists.`);
      }

      return;
    }

    return storage.getKey(run, instance);
  }

  function getKeyAndRelation(name: string, instance: any, relationName: string)
  {
    const key = getKey(name, instance);

    if (key === undefined) 
    {
      return {};
    }

    const relations = run.defs.getRelations(name);
    const relation = relations.find((r) => r.name === relationName);

    if (!relation) 
    {
      if (run.strict) 
      {
        throw new Error(`The relation ${relationName} on ${name} does not exist.`);
      }

      return {};
    }

    return { key, relation };
  }

  function match(a: any, aprops: string[], b: any, bprops: string[])
  {
    for (let i = 0; i < aprops.length; i++)
    {
      const ap = aprops[i];
      const bp = bprops[i];

      if (compare(a[ap], b[bp]) !== 0)
      {
        return false;
      }
    }

    return true;
  }

  function getRelationTypeKey(instance: any, relation: TypeRelation)
  {
    let relatedType: RelationTypeKey = null;

    if (relation.morphs && relation.morphsToRelated) 
    {
      const morphValue = instance[relation.morphs[0]];
      const morphRelated = relation.morphsToRelated.get(morphValue);

      relatedType = relation.related.find((r) => r.name === morphRelated);
    } 
    else 
    {
      relatedType = relation.related[0];
    }

    if (!relatedType) 
    {
      if (run.strict) 
      {
        throw new Error('No relation could be determined.');
      }

      return;
    }

    return relatedType;
  }

  function getRelated(instance: any, relation: TypeRelation, relatedType: RelationTypeKey)
  {
    const relatedInstances = getInstances(relatedType.name);
    const relatedList: any[] = [];

    for (const key in relatedInstances)
    {
      const related = relatedInstances[key];

      if (match(instance, relation.local, related, relatedType.props))
      {
        if (relation.where)
        {
          const [whereProperty, whereValue] = relation.where;

          if (compare(related[whereProperty], whereValue) === 0)
          {
            relatedList.push(related);
          }
        }
        else
        {
          relatedList.push(related);
        }
      }
    }

    return relatedList;
  }

  function getRelatedMap(relatedName: string, relatedList: any[])
  {
    const storage = run.defs.storage[relatedName];

    if (!storage)
    {
      if (run.strict)
      {
        throw new Error(`No storage exists for ${relatedName}`);
      }

      return;
    }

    const map: Record<string, any> = Object.create(null);

    for (const related of relatedList)
    {
      const key = storage.getKey(run, related);

      if (!key)
      {
        if (run.strict)
        {
          throw new Error(`Related ${relatedName} could not calculate a key.`);
        }

        continue;
      }

      map[key] = related;
    }

    return map;
  }

  function fetchExisting(params: LiveCommandMap, context: LiveContext)
  {
    const name = params.name(context);
    const instance = params.instance(context);
    const relationName = params.relation(context);
    const { relation } = getKeyAndRelation(name, instance, relationName);

    if (relation === undefined) 
    {
      return {};
    }

    const relatedType = getRelationTypeKey(instance, relation);

    if (!relatedType)
    {
      return {};
    }

    const existing = getRelated(instance, relation, relatedType);

    if (!existing)
    {
      return {};
    }

    const existingMap = getRelatedMap(relatedType.name, existing);

    return { name, instance, relationName, relation, relatedType, existing, existingMap };
  }

  function clearProps(target: any, props: string[])
  {
    for (const prop of props)
    {
      run.objectSet(target, prop, null);
    }
  }

  function clearReference(instance: any, relation: TypeRelation, related: any, relatedType: RelationTypeKey)
  {
    if (relation.relation.required)
    {
      if (run.strict)
      {
        throw new Error(`You cannot remove a required relationship from ${relation.name} in ${relation.relation.name}.`);
      }

      return;
    }

    // TODO if owns, remove owned

    if (relation.cascade === RelationCascade.NONE)
    {
      clearProps(related, relatedType.props);
    }
    else
    {
      clearProps(instance, relation.local);
    }
  }

  function setProps(target: any, targetProps: string[], source: any, sourceProps: string[])
  {
    for (let i = 0; i < targetProps.length; i++)
    {
      run.objectSet(target, targetProps[i], source[sourceProps[i]]);
    }
  }

  function setReference(instance: any, relation: TypeRelation, related: any, relatedType: RelationTypeKey)
  {
    // TODO if owns & has value, removed owned

    if (relation.cascade === RelationCascade.NONE)
    {
      setProps(related, relatedType.props, instance, relation.local);
    }
    else
    {
      setProps(related, relatedType.props, instance, relation.local);
    }
  }

  run.setOperation(ops.newInstance, (params) => (context) => {
    const name = params.name(context);
    const aliased = run.defs.aliased[name];

    if (!aliased) {
      throw new Error(`The aliased type ${name} is not defined.`);
    }

    return aliased.create();
  });

  run.setOperation(ops.getKey, (params) => (context) =>
    getKey(params.name(context), params.instance(context))
  );

  run.setOperation(ops.save, (params) => (context) => {
    const name = params.name(context);
    const instance = params.instance(context);
    const key = getKey(name, instance);

    if (key === undefined) {
      return false;
    }

    const instances = getInstances(name);
    run.objectSet(instances, key, instance);
    
    return true;
  });

  run.setOperation(ops.remove, (params) => (context) => {
    const name = params.name(context);
    const instance = params.instance(context);
    const key = getKey(name, instance);

    if (key === undefined) {
      return false;
    }

    const instances = getInstances(name);
    const exists = !!instances[key];

    run.objectRemove(instances, key);
    
    return exists;
  });

  run.setOperation(ops.setRelated, (params) => (context) => {
    const { relatedType, instance, relation, existingMap } = fetchExisting(params, context);

    if (!existingMap)
    {
      return 0;
    }

    const related = params.related(context); 
    const relatedArray = isArray(related) ? related : [related];
    const relatedMap = getRelatedMap(relatedType.name, relatedArray);
    let changes = 0;

    for (const existingId in existingMap)
    {
      const existingRelated = existingMap[existingId];

      if (!relatedMap[existingId])
      {
        clearReference(instance, relation, existingRelated, relatedType);
        changes++;
      }
    }

    for (const relatedId in relatedMap)
    {
      const newRelated = relatedMap[relatedId];

      if (!existingMap[relatedId])
      {
        setReference(instance, relation, newRelated, relatedType);
        changes++;
      }
    }

    return changes;
  });

  run.setOperation(ops.addRelated, (params) => (context) => {
    const { relationName, relation, relatedType, instance, existingMap } = fetchExisting(params, context);

    if (!existingMap)
    {
      return 0;
    }

    const related = params.related(context); 
    const relatedArray = isArray(related) ? related : [related];
    const relatedMap = getRelatedMap(relationName, relatedArray)
    let changes = 0;
    
    for (const relatedId in relatedMap)
    {
      if (!existingMap[relatedId])
      {
        setReference(instance, relation, relatedMap[relatedId], relatedType);
        changes++;
      }
    }

    return changes;
  });

  run.setOperation(ops.removeRelated, (params) => (context) => {
    const { relationName, relation, relatedType, instance, existingMap } = fetchExisting(params, context);

    if (!existingMap)
    {
      return 0;
    }

    const related = params.related(context); 
    const relatedArray = isArray(related) ? related : [related];
    const relatedMap = getRelatedMap(relationName, relatedArray)
    let changes = 0;
    
    for (const relatedId in relatedMap)
    {
      if (existingMap[relatedId])
      {
        clearReference(instance, relation, relatedMap[relatedId], relatedType);
        changes++;
      }
    }

    return changes;
  });

  run.setOperation(ops.clearRelated, (params) => (context) => {
    const { relation, relatedType, instance, existingMap } = fetchExisting(params, context);

    if (!existingMap)
    {
      return 0;
    }

    let changes = 0;
    
    for (const existingId in existingMap)
    {
      clearReference(instance, relation, existingMap[existingId], relatedType);
      changes++;
    }

    return changes;
  });

  run.setOperation(ops.getRelated, (params) => (context) => {
    const { relation, existing } = fetchExisting(params, context);

    return relation.relationType instanceof ListType
      ? existing
      : existing[0];
  });

  run.setOperation(ops.isRelated, (params) => (context) => {
    const { relationName, existingMap } = fetchExisting(params, context);

    if (!existingMap)
    {
      return 0;
    }

    const related = params.related(context); 
    const relatedArray = isArray(related) ? related : [related];
    const relatedMap = getRelatedMap(relationName, relatedArray)
    let relatedCount = 0;
    
    for (const relatedId in relatedMap)
    {
      if (existingMap[relatedId])
      {
        relatedCount++;
      }
    }

    return relatedCount;
  });

};