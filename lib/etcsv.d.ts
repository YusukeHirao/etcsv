/// <reference path="../src/DefinitelyTyped/node/node.d.ts" />
/// <reference path="../src/DefinitelyTyped/moment/moment.d.ts" />
/**
* etcsv
*
* @version 0.2.0
* @since 0.1.0
*
*/
declare module etcsv {
    /**
    * imports
    *
    * @version 0.1.0
    * @since 0.1.0
    *
    */
    function imports(filePath: string, charset?: string): Table;
    /**
    * Table
    *
    * @version 0.2.0
    * @since 0.1.0
    *
    */
    class Table {
        /**
        * data
        *
        * @version 0.2.0
        * @since 0.1.0
        *
        */
        public data: any[];
        /**
        * _fields
        *
        * @version 0.2.0
        * @since 0.2.0
        *
        */
        private _fields;
        /**
        * _relations
        *
        * @version 0.2.0
        * @since 0.2.0
        *
        */
        private _relations;
        public setByFieldName(fieldName: string, callback: Function): void;
        /**
        * sql
        *
        * @version 0.2.0
        * @since 0.2.0
        *
        */
        public sql(options: TableSqlMethodOption): SQL;
    }
    /**
    * SQL
    *
    * @version 0.2.0
    * @since 0.2.0
    *
    */
    class SQL {
        /**
        * query
        *
        * @version 0.2.0
        * @since 0.2.0
        *
        */
        public query: string;
        /**
        * constructor
        *
        * @version 0.2.0
        * @since 0.2.0
        *
        */
        constructor(query: string);
        /**
        * output
        *
        * @version 0.2.0
        * @since 0.2.0
        *
        */
        public output(filePath: string): void;
    }
    /**
    * RelationOption
    *
    * @version 0.2.0
    * @since 0.2.0
    *
    */
    interface RelationOption {
        table: string;
        relationalIdMax: number;
        relationalIdFieldName: string;
        selfIdFieldName: string;
    }
    /**
    * TableSqlMethodOption
    *
    * @version 0.2.0
    * @since 0.2.0
    *
    */
    interface TableSqlMethodOption {
        db: string;
        table: string;
        fields: string[];
        relations: RelationOption[];
    }
}
