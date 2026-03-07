import Objection, { Model, RelationType } from 'objection';

export type RelationMapping<M extends Model = Model> = {
  relation: RelationType;
  modelClass: any; // Support lazy loading: class constructor, string path, or getter function
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
