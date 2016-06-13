/// <reference path="app/headers/common.d.ts" />
export default class SqlQuery {
    dbms: string;
    target: any;
    selectModels: any[];
    queryBuilder: any;
    groupByParts: any;
    templateSrv: any;
    scopedVars: any;
    /** @ngInject */
    constructor(target: any, templateSrv?: any, scopedVars?: any);
    updateProjection(): void;
    updatePersistedParts(): void;
    hasGroupByTime(): any;
    addGroupBy(value: any): void;
    removeGroupByPart(part: any, index: any): void;
    removeSelect(index: number): void;
    removeSelectPart(selectParts: any, part: any): void;
    addSelectPart(selectParts: any, type: any): void;
    private renderTagCondition(tag, index, interpolate);
    gettableAndSchema(interpolate: any): any;
    render(interpolate?: any): any;
}
