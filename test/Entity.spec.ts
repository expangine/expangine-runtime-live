import { Types, defs, EntityPrimaryType, EntityOps, Exprs, Relation } from 'expangine-runtime';
import { LiveRuntime } from '../src';


describe('Entity', () => {

  defs.addEntity({
    name: 'Task',
    primaryType: EntityPrimaryType.UUID,
    describe: Exprs.get('instance', 'name'),
    type: Types.object({
      name: Types.text(),
      description: Types.optional(Types.text()),
    }),
  });

  defs.addEntity({
    name: 'User',
    primaryType: EntityPrimaryType.GIVEN,
    key: Exprs.get('instance', 'id'),
    describe: Exprs.get('instance', 'email'),
    type: Types.object({
      id: Types.text(),
      email: Types.text(),
    }),
    indexes: {
      primary: {
        props: ['id'],
        primary: true,
      },
    },
  });

  defs.addRelation(Relation.hasMany(defs, {
    one: 'User',
    oneRelationName: 'created_tasks',
    many: 'Task',
    manyRelationName: 'creator',
    owns: false,
  }));

  it('save, get, remove, get', () =>
  {
    const task = LiveRuntime.run(
      Exprs.define({
        task: Exprs.object({
          name: Exprs.const('Finish Projects'),
        }),
        saved: Exprs.op(EntityOps.save, {
          name: Exprs.entity('Task'),
          instance: Exprs.get('task'),
        }),
      }, Exprs.get('task')),
    {});

    const tasks = LiveRuntime.run(
      Exprs.op(EntityOps.get, {
        name: Exprs.entity('Task'),
      }), 
    {});

    expect(tasks).toEqual([task]);

    const taskRemoved = LiveRuntime.run(
      Exprs.op(EntityOps.remove, {
        name: Exprs.entity('Task'),
        instance: Exprs.const(task),
      }),
    {});

    expect(taskRemoved).toBeTruthy();

    const tasksAgain = LiveRuntime.run(
      Exprs.op(EntityOps.get, {
        name: Exprs.entity('Task'),
      }), 
    {});

    expect(tasksAgain).toEqual([]);
  });

  it('save, setRelated, isRelated, getRelated', () =>
  {
    // window.console.log(defs.getRelations('Task'));

    const { task, taskSaved, taskRelated, admin, adminSaved } = LiveRuntime.run(
      Exprs.define({
        admin: Exprs.object({
          id: Exprs.const('admin'),
          email: Exprs.const('admin@expangine.com'),
        }),
        task: Exprs.object({
          name: Exprs.const('Bag End'),
        }),
        adminSaved: Exprs.op(EntityOps.save, {
          name: Exprs.entity('User'),
          instance: Exprs.get('admin'),
        }),
        taskSaved: Exprs.op(EntityOps.save, {
          name: Exprs.entity('Task'),
          instance: Exprs.get('task'),
        }),
        taskRelated: Exprs.op(EntityOps.setRelated, {
          name: Exprs.entity('Task'),
          instance: Exprs.get('task'),
          relation: Exprs.relation('creator'),
          related: Exprs.get('admin'),
        }),
      }, Exprs.object({
        admin: Exprs.get('admin'),
        task: Exprs.get('task'),
        adminSaved: Exprs.get('adminSaved'),
        taskSaved: Exprs.get('taskSaved'),
        taskRelated: Exprs.get('taskRelated'),
      })),
    {});

    expect(admin).toEqual({ id: 'admin', email: 'admin@expangine.com' });
    expect(adminSaved).toEqual(true);
    expect(task.name).toEqual('Bag End');
    expect(task.creator_id).toEqual('admin');
    expect(taskSaved).toEqual(true);
    expect(taskRelated).toEqual(1);

    const { taskIsRelated, adminIsRelated } = LiveRuntime.run(
      Exprs.object({
        taskIsRelated: Exprs.op(EntityOps.isRelated, {
          name: Exprs.entity('Task'),
          instance: Exprs.const(task),
          relation: Exprs.relation('creator'),
          related: Exprs.const(admin),
        }),
        adminIsRelated: Exprs.op(EntityOps.isRelated, {
          name: Exprs.entity('User'),
          instance: Exprs.const(admin),
          relation: Exprs.relation('created_tasks'),
          related: Exprs.const(task),
        }),
      }),
    {});

    expect(taskIsRelated).toEqual(1);
    expect(adminIsRelated).toEqual(1);

    const { creator, created_tasks } = LiveRuntime.run(
      Exprs.object({
        creator: Exprs.op(EntityOps.getRelated, {
          name: Exprs.entity('Task'),
          instance: Exprs.const(task),
          relation: Exprs.relation('creator'),
        }),
        created_tasks: Exprs.op(EntityOps.getRelated, {
          name: Exprs.entity('User'),
          instance: Exprs.const(admin),
          relation: Exprs.relation('created_tasks'),
        }),
      }),
    {});

    expect(creator).toEqual(admin);
    expect(created_tasks).toEqual([task]);
  });

});