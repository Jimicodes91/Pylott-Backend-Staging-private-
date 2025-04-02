import Objection, { Model, RelationType } from 'objection';

export type RelationMapping<M extends Model = Model> = {
  relation: RelationType;
  modelClass: { new (...args: any[]): any };
  filter?: (query: Objection.QueryBuilderType<M>) => Objection.QueryBuilderType<M>;
  join: {
    from: string;
    to: string;
    [key: string]: string | { from: string; to: string };
  };
};

export type ModelsRelationMapping = {
  [key: string]: RelationMapping<any>;
};
