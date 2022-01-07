/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search', 'N/email', 'N/runtime'],
    /**
     * @param{record} record
     * @param{search} search
     */
    function(record, search, email, runtime){
        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */
         /*Global Variables*/
        var departmentD;
        var classD;
        var locationD;
        function getInputData(inputContext){
            var loadSearch = search.load({
                id: 'customsearch_time_entry_to_post'
            });
            return loadSearch;
        }
        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */
        function map(mapContext) {
            try {
                var accountCr = runtime.getCurrentScript().getParameter("custscript_proj_var_acct");
                var currentUser = 239241;
                var currentUserEmail = 'rubykumari413@gmail.com'
                var data = JSON.parse(mapContext.value);
                //log.debug('data',data)
                var id = data.id;
                var empName = data.values.employee.value;
                var custName = data.values.customer.value;
                var jrnalMemo = data.values.memo;
                var hours = data.values.hours;
                log.debug('Time sheet enterted for - ',id)
                hours = ''+hours.split(':')[0]+'.'+hours.split(':')[1]+'';
                var timebillCheck = search.lookupFields({             
                    type:'timebill',
                    id: id,
                    columns: ['isbillable']
                });
                var billCbk = timebillCheck['isbillable'];

                var transactionCheck = search.lookupFields({             
                    type:'employee',
                    id: empName,
                    columns: ['subsidiary','department','class','location','custentity_laborcost_usd']
                });

                var subsidaryD = transactionCheck['subsidiary'][0].value;
                var subsidaryText = transactionCheck['subsidiary'][0].text;
                try{
                    departmentD = transactionCheck['department'][0].value;
                    classD = transactionCheck['class'][0].value;
                    locationD = transactionCheck['location'][0].value; 
                }catch(e){
                    log.debug('e',e)
                }
                
                var labourCost = transactionCheck['custentity_laborcost_usd'];
                var finalAmount = (Number(Number(hours)*Number(labourCost))).toFixed(2);
                var finalLineMemo = 'Time Entry for '+subsidaryText+'; memo:'+jrnalMemo+'';

                var jobCheck = search.lookupFields({             
                    type:'job',
                    id: custName,
                    columns: ['currency','projectexpensetype']
                });

                var lvCurrency = jobCheck['currency'][0].value;
                var accountDr = jobCheck['projectexpensetype'][0].value;
                if(accountDr == '1'){accountDr = 913;}else if(accountDr == '2'){accountDr = 914;}else if(accountDr == -3){accountDr = 885;}else{accountDr = 884;}
                /*
                //// @@@@@@@@@@@@ Account Map @@@@@@@@@@@ ////
                Direct Salary == 61190 Project Direct Salary (895/913)
                Indirect Salary == Project Indirect Salary  (896/914)
                Overhead == Indirect Labor   (885)
                Regular  == Direct Labor    (884)
                //// @@@@@@@@@@@@ Account Map END @@@@@@@@@@@ ////*/

                //creating journal record
                journalRecordCreate = record.create({
                    type: 'journalentry',
                    isDynamic: true                       
                });
                journalRecordCreate.setValue({
                    fieldId : 'subsidiary',
                    value : subsidaryD
                });
                journalRecordCreate.setValue({
                    fieldId : 'currency',
                    value : lvCurrency
                });
                journalRecordCreate.setValue({
                    fieldId : 'trandate',
                    value : new Date()
                });
                journalRecordCreate.setValue({
                    fieldId : 'approved',
                    value : true
                });
                journalRecordCreate.setValue({
                    fieldId : 'timebillflag',
                    value : 'T'
                });
                journalRecordCreate.setValue({
                    fieldId : 'custbody_sr_time_track_link',
                    value : id
                });
                
                var type = 'debit';
                addLineDataOnJournalRecord(finalLineMemo,accountDr,finalAmount,type);
                var type = 'credit';
                addLineDataOnJournalRecord(finalLineMemo,accountCr,finalAmount,type);
                try{
                    if(billCbk == false || billCbk == 'F' || billCbk == ''){
                        var journalRecordId = journalRecordCreate.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });
                        log.debug('journalRecordId',journalRecordId)
                        /*var rec = record.load({type:'timebill',id:id});
                        rec.setValue({fieldId:'transactionid',value:Number(journalRecordId)});
                        rec.setValue({fieldId:'posted',value:true});
                        var recordSubmit = rec.save()*/
                        var recordSubmit = record.submitFields({
                            type: 'timebill',
                            id: id,
                            values: {
                                'posted': 'T',
                                'transactionid':Number(journalRecordId)
                            },
                            options: {
                                enableSourcing: true,
                                ignoreMandatoryFields : true
                            }
                        });
                        log.debug('recordSubmit',recordSubmit)
                    }else{
                        log.debug('its charges')
                    }
                    
                }catch(journalRecordSubmitError){
                    record.submitFields({
                        type: 'timebill',
                        id: id,
                        values: {
                            'posted': 'F'
                        }
                    });
                    log.error({title:'Error in journal Creation: ', details:journalRecordSubmitError});
                    email.send({author: currentUser,
                        recipients: currentUserEmail,
                        subject: 'Error while submitting journal for Time sheet: '+id+'',
                        body: 'Hi,\n Error is:\n '+journalRecordSubmitError+''
                    });
                }
            }catch(e){
                log.debug('Error', e);
            }
        }
        function addLineDataOnJournalRecord(memo,account,ammount,type){
            if(ammount != '' && ammount != undefined || ammount != null){
                if(account != '' && account != undefined){
                    if(type == 'credit'){
                        var line = journalRecordCreate.getLineCount({
                            sublistId: 'line'
                        });
                        journalRecordCreate.selectLine({
                            sublistId: 'line',
                            line: line
                        });
                        journalRecordCreate.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'account',
                            value: account
                        });
                        journalRecordCreate.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'credit',
                            value: ammount
                        });
                        journalRecordCreate.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'memo',
                            value: memo
                        });
                        try{
                            journalRecordCreate.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'department',
                                value: departmentD
                            });
                            journalRecordCreate.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'class',
                                value: classD
                            });
                            journalRecordCreate.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'location',
                                value: locationD
                            });
                        }catch(e){
                            log.debug("issue with department")
                        }
                        journalRecordCreate.commitLine({ sublistId: 'line'});  
                    }else if(type == 'debit'){
                        var line = journalRecordCreate.getLineCount({
                            sublistId: 'line'
                        });
                        journalRecordCreate.selectLine({
                            sublistId: 'line',
                            line: line
                        });
                        journalRecordCreate.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'account',
                            value: account
                        });
                        journalRecordCreate.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'debit',
                            value: ammount
                        });
                        journalRecordCreate.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'memo',
                            value: memo
                        });
                        try{
                            journalRecordCreate.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'department',
                                value: departmentD
                            });
                            journalRecordCreate.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'class',
                                value: classD
                            });
                            journalRecordCreate.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'location',
                                value: locationD
                            });
                        }catch(e){
                            log.debug("issue with department")
                        }
                        journalRecordCreate.commitLine({sublistId: 'line'});
                    } 
                }
            }
        }
        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        function reduce (reduceContext) {

        }


        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */
        function summarize (summaryContext) {

        }
        return {
            getInputData:getInputData,
            map:map,
            summarize:summarize
        }
    });