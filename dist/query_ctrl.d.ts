/// <reference path="app/headers/common.d.ts" />
import SqlQuery from './sql_query';
import { QueryCtrl } from 'app/plugins/sdk';
export declare class SqlQueryCtrl extends QueryCtrl {
    private templateSrv;
    private $q;
    private uiSegmentSrv;
    static templateUrl: string;
    queryModel: SqlQuery;
    queryBuilder: any;
    groupBySegment: any;
    resultFormats: any[];
    schemaSegment: any;
    timeColDataTypeSegment: any;
    tagSegments: any[];
    selectMenu: any;
    tableSegment: any;
    removeTagFilterSegment: any;
    matchOperators: any;
    /** @ngInject **/
    constructor($scope: any, $injector: any, templateSrv: any, $q: any, uiSegmentSrv: any);
    setDefault(): void;
    buildSelectMenu(): void;
    groupByAction(): void;
    removeGroupByPart(part: any, index: any): void;
    addSelectPart(selectParts: any, cat: any, subitem: any): void;
    removeSelectPart(selectParts: any, part: any): void;
    selectPartUpdated(): void;
    fixTagSegments(): void;
    tableChanged(): void;
    getSchemaSegments(): any;
    schemaChanged(): void;
    getTimeColDataTypeSegments(): any;
    timeColDataTypeChanged(): void;
    toggleEditorMode(): void;
    getTableSegments(): any;
    getPartOptions(part: any): any;
    handleQueryError(err: any): any[];
    transformToSegments(addTemplateVars: any): (results: any) => any;
    getTagsOrValues(segment: any, index: any): any;
    getFieldSegments(): any;
    tagSegmentUpdated(segment: any, index: any): void;
    rebuildTargetTagConditions(): void;
    getTagValueOperator(tagValue: any, tagOperator: any): any;
    getCollapsedText(): any;
}
