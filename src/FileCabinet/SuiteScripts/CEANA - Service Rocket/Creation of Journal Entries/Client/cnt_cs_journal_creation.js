/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/search'],

    function (currentRecord, search) {
        var currRec = currentRecord.get();

        function createJournal() {
            var inRevArrangementID = currRec.id;
            console.log('inRevArrangementID', inRevArrangementID);

            var arrData = searchRevenuePlan(inRevArrangementID);
            console.log('arrData', arrData);
        }

        function searchRevenuePlan(inRevArrangementID) {
            var objData = {};
            var arrData = [];

            var objSearchRevenuePlan = search.create({
                type: "revenueplan",
                filters:
                    [
                        ["transaction.internalid", "anyof", inRevArrangementID],
                        "AND",
                        ["revenueplantype", "anyof", "ACTUAL"]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "internalid",
                            join: "transaction",
                            summary: "GROUP",
                            label: "Internal ID"
                        }),
                        search.createColumn({
                            name: "internalid",
                            summary: "GROUP",
                            label: "Internal ID"
                        }),
                        search.createColumn({
                            name: "recordnumber",
                            summary: "GROUP",
                            sort: search.Sort.ASC,
                            label: "Number"
                        })
                    ]
            });

            objSearchRevenuePlan.run().each(function (result) {
                objData = {
                    revenuePlanNumber: result.getValue({name: 'recordnumber', summary: 'GROUP'})
                }

                arrData.push(objData);
                return true;
            });

            return arrData;
        }

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {

        }

        return {
            createJournal: createJournal,
            pageInit: pageInit
        };

    });
