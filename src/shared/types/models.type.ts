import Objection from 'objection';

export type ModelsRelationMapping = {
  [key: string]: {
    relation: Objection.RelationType;
    modelClass: { new (...args: any[]): any };
    join: {
      from: string;
      to: string;
      [key: string]: string | { from: string; to: string };
    };
  };
};
