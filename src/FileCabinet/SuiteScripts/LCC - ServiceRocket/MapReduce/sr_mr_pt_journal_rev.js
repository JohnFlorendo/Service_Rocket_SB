/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
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
            return searchJournalEntries();
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
                var recId = data.values['GROUP(internalid)'].value;

                var loadRecord = record.load({
                    id: recId,
                    type: 'journalentry'
                })

                var timeBillCheck = loadRecord.getValue({
                    fieldId: 'timebillflag'
                });

                if (timeBillCheck == 'T') {
                    log.debug('isFromPostTime', timeBillCheck);

                    var journalId = loadRecord.save();

                    log.debug({
                        title: 'Journal Entry ID',
                        details: journalId
                    });

                } else log.debug('isFromPostTime', timeBillCheck);

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

        function searchJournalEntries() {
            var journalentrySearchObj = search.create({
                type: "journalentry",
                filters:
                    [
                        ["type","anyof","Journal"],
                        "AND",
                        ["isreversal","is","F"],
                        "AND",
                        ["mainline","is","T"],
                        "AND",
                        ["reversaldate","isempty",""],
                        "AND",
                        ["memo","contains","time entry"],
                        "AND",
                        ["recordtype","is","journalentry"]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "internalid",
                            summary: "GROUP",
                            label: "Internal ID"
                        }),
                        search.createColumn({
                            name: "recordtype",
                            summary: "GROUP",
                            label: "Record Type"
                        })
                    ]
            });
            var searchResultCount = journalentrySearchObj.runPaged().count;
            log.debug("journalentrySearchObj result count",searchResultCount);

            return journalentrySearchObj;
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });
