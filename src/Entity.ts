import { EntityOps, EntityRelation, RelationTypeKey, DataTypes, isArray, ListType, RelationCascade, Entity, isObject, isEmpty } from 'expangine-runtime';
import { LiveRuntimeImpl, LiveCommandMap, LiveContext } from './LiveRuntime';
import { _object, _objectMaybe } from './helper';


export default function(run: LiveRuntimeImpl)
{
  const ops = EntityOps;

  function getEntity(name: string): Entity | undefined
  {
    if (!name) 
    {
      if (run.strict) 
      {
        throw new Error('An entity could not be determined without a name.');
      }

      return;
    }

    const entity = run.defs.getEntity(name);

    if (!entity)
    {
      if (run.strict)
      {
        throw new Error(`An entity with the name ${name} does not exist.`);
      }

      return;
    }

    return entity;
  }

  function getKey(entity: Entity | null, instance: any) 
  {
    if (!isObject(instance))
    {
      if (run.strict)
      {
        throw new Error(`Cannot get a key for a non-object entity instance.`);
      }

      return;
    }

    return entity
      ? entity.getKey(run, instance)
      : undefined;
  }

  function getKeyAndRelation(entity: Entity, instance: any, relationName: string)
  {
    const key = getKey(entity, instance);

    if (key === undefined) 
    {
      return {};
    }

    const relations = run.defs.getRelations(entity.name);
    const relation = relations.find((r) => r.name === relationName);

    if (!relation) 
    {
      if (run.strict) 
      {
        throw new Error(`The relation ${relationName} on ${entity.name} does not exist.`);
      }

      return {};
    }

    return { key, relation };
  }

  function match(a: any, aprops: string[], b: any, bprops: string[])
  {
    for (let i = 0; i < aprops.length; i++)
    {
      const ap = a[aprops[i]];
      const bp = b[bprops[i]];

      if ((isEmpty(ap) && isEmpty(bp)) || !DataTypes.equals(ap, bp)) 
      {
        return false;
      }
    }

    return true;
  }

  function getRelationTypeKey(instance: any, relation: EntityRelation)
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

  function getRelated(instance: any, relation: EntityRelation, relatedType: RelationTypeKey, relatedEntity: Entity | null)
  {
    if (!relatedEntity)
    {
      return;
    }

    return relatedEntity.instances.filter((related) =>
    {
      return match(instance, relation.local, related, relatedType.props)
        ? relation.where
          ? DataTypes.equals(related[relation.where[0]], relation.where[1])
          : true
        : false;
    });
  }

  function getRelatedMap(entity: Entity | null, relatedList: any[])
  {
    if (!entity)
    {
      return {};
    }

    const map: Record<string, any> = Object.create(null);

    for (const related of relatedList)
    {
      const key = entity.getKey(run, related);

      if (!key)
      {
        if (run.strict)
        {
          throw new Error(`Related ${entity.key} could not calculate a key.`);
        }

        continue;
      }

      map[key] = related;
    }

    return map;
  }

  function fetchExisting(params: LiveCommandMap, context: LiveContext)
  {
    const entity = getEntity(params.name(context));
    const instance = params.instance(context);
    const relationName = params.relation(context);
    const { relation } = getKeyAndRelation(entity, instance, relationName);

    if (relation === undefined) 
    {
      return {};
    }

    const relatedType = getRelationTypeKey(instance, relation);

    if (!relatedType)
    {
      return {};
    }

    const relatedEntity = getEntity(relatedType.name);
    const existing = getRelated(instance, relation, relatedType, relatedEntity);

    if (!existing)
    {
      return {};
    }

    const existingMap = getRelatedMap(relatedEntity, existing);

    return { name, instance, relationName, relation, relatedType, relatedEntity, existing, existingMap };
  }

  function clearProps(target: any, props: string[])
  {
    for (const prop of props)
    {
      run.objectSet(target, prop, null);
    }
  }

  function clearReference(instance: any, relation: EntityRelation, related: any, relatedType: RelationTypeKey)
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

  function setReference(instance: any, relation: EntityRelation, related: any, relatedType: RelationTypeKey)
  {
    // TODO if owns & has value, removed owned

    if (relation.cascade === RelationCascade.NONE)
    {
      setProps(related, relatedType.props, instance, relation.local);
    }
    else
    {
      setProps(instance, relation.local, related, relatedType.props);
    }
  }

  run.setOperation(ops.newInstance, (params) => (context) => {
    const entity = getEntity(params.name(context));
    
    if (!entity) {
      return {};
    }

    const values = entity.type.create();
    const initial = _objectMaybe(params.initial, context, null);

    if (initial) {
      for (const prop in initial) {
        values[prop] = DataTypes.copy(initial[prop]);
      }
    }

    return values;
  });

  run.setOperation(ops.getKey, (params) => (context) =>
    getKey(getEntity(params.name(context)), params.instance(context))
  );

  run.setOperation(ops.get, (params, scope) => (context) => {
    const entity = getEntity(params.name(context));

    if (!entity) {
      return null;
    }

    if (!params.where) {
      return entity.instances;
    }

    return run.enterScope(context, [scope.instance], (inner) => 
      entity.instances.filter((instance) => {
        run.dataSet(inner, scope.instance, instance);

        return params.where(inner);
      })
    );
  });

  run.setOperation(ops.save, (params) => (context) => {
    const entity = getEntity(params.name(context));
    const instance = params.instance(context);

    if (!entity || !instance) {
      return false;
    }

    entity.setKey(instance);

    const key = getKey(entity, instance);

    if (key === undefined) {
      return false;
    }

    const index = entity.instances.findIndex((other) => getKey(entity, other) === key);

    if (index === -1) {
      run.arrayAdd(entity.instances, instance);
    } else {
      run.arraySet(entity.instances, index, instance);
    }
    
    return true;
  });

  run.setOperation(ops.remove, (params) => (context) => {
    const entity = getEntity(params.name(context));
    const instance = params.instance(context);
    const key = getKey(entity, instance);

    if (key === undefined) {
      return false;
    }

    const index = entity.instances.findIndex((other) => getKey(entity, other) === key);
    const exists = index !== -1;

    if (exists) { 
      run.arrayRemoveAt(entity.instances, index);
    }
    
    return exists;
  });

  run.setOperation(ops.setRelated, (params) => (context) => {
    const { relatedType, relatedEntity, instance, relation, existingMap } = fetchExisting(params, context);

    if (!existingMap)
    {
      return 0;
    }

    const related = params.related(context); 
    const relatedArray = isArray(related) ? related : [related];
    const relatedMap = getRelatedMap(relatedEntity, relatedArray);
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
    const { relation, relatedType, relatedEntity, instance, existingMap } = fetchExisting(params, context);

    if (!existingMap)
    {
      return 0;
    }

    const related = params.related(context); 
    const relatedArray = isArray(related) ? related : [related];
    const relatedMap = getRelatedMap(relatedEntity, relatedArray)
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
    const { relatedEntity, relation, relatedType, instance, existingMap } = fetchExisting(params, context);

    if (!existingMap)
    {
      return 0;
    }

    const related = params.related(context); 
    const relatedArray = isArray(related) ? related : [related];
    const relatedMap = getRelatedMap(relatedEntity, relatedArray)
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
    const { relatedEntity, existingMap } = fetchExisting(params, context);

    if (!existingMap)
    {
      return 0;
    }

    const related = params.related(context); 
    const relatedArray = isArray(related) ? related : [related];
    const relatedMap = getRelatedMap(relatedEntity, relatedArray)
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