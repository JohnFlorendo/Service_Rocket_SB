/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
 /*
 Script Name          : SR MR Mass Updating Calculated Cost
 Version              : 2.0
 Created By           : Ruby
 Created On           : 18/06/2021
 Last modified on/by  : 
 Description          : 
 */
define(['N/record', 'N/search'],
    /**
     * @param{record} record
     */
    function(record, search) {
        /**
         * Marks the beginning of the Map/Reduce process and generates input data.
         *
         * @typedef {Object} ObjectRef
         * @property {number} id - Internal ID of the record instance
         * @property {string} type - Record type id
         *
         * @return {Array|Object|Search|RecordRef} inputSummary
         * @since 2015.1
         */
        function getInputData() {
            var loadSearch = search.load({
                id: 'customsearch13916'
            });
            return loadSearch;
        }
        /**
         * Executes when the map entry point is triggered and applies to each key/value pair.
         *
         * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
         * @since 2015.1
         */
        function map(context) {
            try {
                var data = JSON.parse(context.value);
                var timeDuration = data.values.custrecord_sr_duration_decimal;
                var employeId = data.values.custrecord_time_employee.value;
                var recordId = data.id;
                var employeeRec = search.lookupFields({
                    type: search.Type.EMPLOYEE,
                    id: employeId,
                    columns: ['custentity_laborcost_usd']
                });
                var labourCost = employeeRec.custentity_laborcost_usd;
                var calcuatedCost = Number(labourCost)*Number(timeDuration);
                calcuatedCost = calcuatedCost.toFixed(2);

                record.submitFields({
                    type: 'customrecord_sr_time_master',
                    id: recordId,
                    values: {
                        'custrecord_sr_calculated_cost': calcuatedCost
                    }
                });
            }catch(e){
                log.debug('Error in Map', e);
            }
        }
        /**
         * Executes when the reduce entry point is triggered and applies to each group.
         *
         * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
         * @since 2015.1
         */
        function reduce(context) {

        }
        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function summarize(summary) {

        }
        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });
