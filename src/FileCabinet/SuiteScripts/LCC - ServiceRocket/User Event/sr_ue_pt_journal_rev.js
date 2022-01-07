/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/ui/serverWidget', 'N/search','N/task'],
    /**
     * @param{record} record
     */
    function (record, runtime, serverWidget, search, task) {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        function beforeLoad(scriptContext){
            hideFields(scriptContext);
        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        function beforeSubmit(scriptContext){
            var newRecord = scriptContext.newRecord;
        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        function afterSubmit (scriptContext) {
            var newRecord = scriptContext.newRecord;
            if(newRecord.type != 'timebill' && newRecord.type != 'timesheet')
            {
                reverseJournalEntry(scriptContext);
                addReversalFieldValues(scriptContext);
            }else{
                var internalId = newRecord.id;
                var scriptTask = task.create({taskType: task.TaskType.SCHEDULED_SCRIPT});
                scriptTask.scriptId = 'customscript_sr_ss_apr_post';
                scriptTask.deploymentId = 'customdeploy_sr_ss_apr_post';
                scriptTask.params = {'custscript_record_id': internalId};
                var scriptTaskId = scriptTask.submit();
                newRecord.setValue('posted','T');
            }
        }

        /** function to reverse Journal Entry created from Post Time
         */
        function reverseJournalEntry(scriptContext){
            try {
                var recJournal = scriptContext.newRecord;
                var tranDate = recJournal.getValue({
                    fieldId: 'trandate'
                });
                var timeBillCheck = recJournal.getValue({
                    fieldId: 'timebillflag'
                })
                log.debug('inside Rev',timeBillCheck)
                if(timeBillCheck == 'T') { //if True then Reverse the Journal Entry
                    log.debug('isFromPostTime', timeBillCheck)
                    var loadCurrentJournal = record.load({
                        type: recJournal.type,
                        id: recJournal.id
                    });

                    loadCurrentJournal.setValue({
                        fieldId: 'reversaldate',
                        value: tranDate
                    });

                    var journalId = loadCurrentJournal.save();

                    log.debug({
                        title: 'Journal Entry Reversed',
                        details: journalId
                    });
                }
                else log.debug('isFromPostTime', timeBillCheck);
            } catch (e) {
                log.debug('afterSubmit', e);
            }
        }

        function hideFields(scriptContext){
            var recJournal = scriptContext.newRecord;
            var recForm = scriptContext.form;
            var timeBillCheck = recJournal.getValue({
                fieldId: 'timebillflag'
            })

            if(timeBillCheck == 'F'){
                recForm.getField({
                    id: 'custbody_sr_reversal'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                })
                recForm.getField({
                    id: 'custbody_sr_custom_reversal_date'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                })
            }
        }

        function searchReversal(reversalNum){
            var reversalJournalId = null;
            try{
                var journalentrySearchObj = search.create({
                    type: "journalentry",
                    filters:
                        [
                            ["type","anyof","Journal"],
                            "AND",
                            ["number","equalto",reversalNum]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "ordertype",
                                sort: search.Sort.ASC
                            }),
                            "tranid",
                        ]
                });
                var searchResult = journalentrySearchObj.run().getRange({
                    start: 0,
                    end: 1
                });
                if(searchResult.length > 0){
                    reversalJournalId = searchResult[0].id;
                }

            } catch(e){
                log.debug('error in searchReversal()', e);
            }
            return reversalJournalId;
        }
        function searchReversalNumber(journalEntryId){
            var reversalJournal = {};
            try{
                var journalentrySearchObj = search.create({
                    type: "journalentry",
                    filters:
                        [
                            ["type","anyof","Journal"],
                            "AND",
                            ["internalid","is",journalEntryId]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "ordertype",
                                sort: search.Sort.ASC
                            }),
                            "reversalnumber",
                            "reversaldate"
                        ]
                });
                var searchResult = journalentrySearchObj.run().getRange({
                    start: 0,
                    end: 1
                });
                if(searchResult.length > 0){
                    reversalJournal.id = searchResult[0].getValue('reversalnumber');
                    reversalJournal.date = searchResult[0].getValue('reversaldate');
                }

            } catch(e){
                log.debug('error in searchReversal()', e);
            }
            return reversalJournal;
        }

        function addReversalFieldValues(scriptContext){
            try{
                var recJournal = scriptContext.newRecord;

                var timeBillCheck = recJournal.getValue({
                    fieldId: 'timebillflag'
                })

                var reversalDate = recJournal.getValue({
                    fieldId: 'reversaldate'
                });

                var journalReversalNumber = searchReversalNumber(recJournal.id);
                var journalReversal = searchReversal(journalReversalNumber.id);
                log.debug('journalRev', journalReversal);
                if(timeBillCheck == 'T') {
                    log.debug('isFromPostTime', timeBillCheck);
                    var journalId = record.submitFields({
                        type: recJournal.type,
                        id: recJournal.id,
                        values: {
                            'custbody_sr_reversal': journalReversal,
                            'custbody_sr_custom_reversal_date': journalReversalNumber.date,
                            'customform': 106
                        }
                    });
                } else log.debug('isFromPostTime', timeBillCheck);

            }catch(e){
                log.debug('error in addReversalFields()', e);
            }
        }

        function addReverseButton(scriptContext){
            var recJournal = scriptContext.newRecord;

            var timeBillCheck = recJournal.getValue({
                fieldId: 'timebillflag'
            })
            if(timeBillCheck == "T"){
                var form = scriptContext.form;
                form.addButton({
                    id: 'custpage_reverse_button',
                    label: 'Reverse',
                    functionName: 'alert("Test")'
                });
            }
        }

        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        }

    });