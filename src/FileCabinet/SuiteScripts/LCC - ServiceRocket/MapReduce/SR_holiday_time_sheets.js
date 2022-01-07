/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */
 /*
 Script Name          : SR Holiday Time Sheets
 Version              : 2.0
 Created By           : Ruby
 Created On           : 2rd Feb 2020
 Last modified on/by  : 8th March 2021/ Ruby
 Description          : This script is responsible to create timesheet records for the employee 
                        based on the holiday list. Run on the starting of the year.
 */
define(['N/record', 'N/search', 'N/email', 'N/format','N/runtime'],
    function(record, search, email, format,runtime){
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
        function getInputData(inputContext){
            var searchId = runtime.getCurrentScript().getParameter({name: "custscript_srv_saved_search"});
            var empId = runtime.getCurrentScript().getParameter({name: "custscript_mr_emp_list"});
            var objInputs = [];
            if(empId){
                objInputs.push({
                    'id'        : empId,
                });
            }else{
                var loadSearch = search.load({
                    id: searchId
                });
                var searchResult = getAllResults(loadSearch);
                

                searchResult.forEach(function(result) {
                    objInputs.push({
                        'id'        : result.id,
                    });
                    return true;
                });
            }
            return objInputs; 
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

                var data = JSON.parse(mapContext.value);
                var today =  new Date();
                var currentYear = today.getFullYear();
                var payitemId = runtime.getCurrentScript().getParameter("custscript_mr_payitem");

                var id = data.id;
                var employeRec = search.lookupFields({
                    type: search.Type.EMPLOYEE,
                    id: id,
                    columns: ['workcalendar']
                });
                if (employeRec.workcalendar[0]) {
                    var workCal = employeRec.workcalendar[0].value;
                }
                
                var timebillSearchObj = search.create({
                   type: "timebill",
                   columns: ['internalid','memo'],
                   filters:
                   [
                      ["type","anyof","A"], 
                      "AND", 
                      ["payitem","anyof",payitemId], 
                      "AND", 
                      ["employee","anyof",id], 
                      "AND", 
                      ["datecreated","within","thisyear"]
                   ]
                });
                var myResult = timebillSearchObj.run();

                var resRange = myResult.getRange({
                    start: 0,
                    end: 1000
                });
                var workcalendarSearchObj = search.create({
                   type: "workcalendar",
                   columns: ['internalid', 'name', 'workhoursperday', 'comments', 'exceptiondate', 'exceptiondescription'],
                   filters:[
                      ["internalid","anyof",workCal],
                      "AND",
                      ["exceptiondate","within","thisyear"]
                   ]
                });
                var myResultSet = workcalendarSearchObj.run();

                var resultRange = myResultSet.getRange({
                    start: 0,
                    end: 1000
                });

                if(resRange.length <= 0){
                    log.debug('Number of holidays-',resultRange.length)
                    for (var i = 0; i < resultRange.length; i++) {
                        var timeMemo = resultRange[i].getValue('exceptiondescription');
                        var timeDate = resultRange[i].getValue('exceptiondate');
                        timeMemo = ""+timeMemo+" "+currentYear+" || Added via Script";
                        timeDate = format.format({value: timeDate, type: format.Type.DATE})

                        var timeRec = record.create({
                            type: 'timebill'
                        });
                        timeRec.setValue('employee', id);
                        timeRec.setValue('hours', 8);
                        timeRec.setValue('istimebillablebydefault', true);
                        timeRec.setValue('memo', timeMemo);
                        timeRec.setValue('payrollitem', payitemId);
                        timeRec.setValue('supervisorapproval', true);
                        timeRec.setText({fieldId: 'trandate', text: timeDate});
                        timeRec.setValue('approvalstatus', 3);
                        timeRec.setValue('custcol_write_off_approval', 4);
                        var savedRec = timeRec.save();
                    }
                    log.debug('Time sheet enterted for the employee- ',id)
                }else{
                    /*if(resultRange.length <= resRange.length){
                        log.debug('Employee skiped as the time sheet are already created for this year.',id);
                    }else{*/
                        for (var i = 0; i < resultRange.length; i++) {
                            var timeMemo = resultRange[i].getValue('exceptiondescription');
                            var timebillSearchObj = search.create({
                               type: "timebill",
                               columns: ['internalid','memo'],
                               filters:
                               [
                                  ["type","anyof","A"], 
                                  "AND", 
                                  ["payitem","anyof",payitemId], 
                                  "AND", 
                                  ["employee","anyof",id], 
                                  "AND", 
                                  ["datecreated","within","thisyear"],
                                  "AND",
                                  ["memo","contains",timeMemo],
                                  "AND", 
                                  ["date","within","thisyear"]
                               ]
                            });
                            var myResult = timebillSearchObj.run();

                            var resRangeCk = myResult.getRange({
                                start: 0,
                                end: 1000
                            });

                            if(resRangeCk.length <= 0){
                                var timeDate = resultRange[i].getValue('exceptiondate');
                                timeMemo = ""+timeMemo+" "+currentYear+" || Added via Script";
                                timeDate = format.format({value: timeDate, type: format.Type.DATE})

                                var timeRec = record.create({
                                    type: 'timebill'
                                });
                                timeRec.setValue('employee', id);
                                timeRec.setValue('hours', 8);
                                timeRec.setValue('istimebillablebydefault', true);
                                timeRec.setValue('memo', timeMemo);
                                timeRec.setValue('payrollitem', payitemId);
                                timeRec.setValue('supervisorapproval', true);
                                timeRec.setText({fieldId: 'trandate', text: timeDate});
                                timeRec.setValue('approvalstatus', 3);
                                timeRec.setValue('custcol_write_off_approval', 4);
                                var savedRec = timeRec.save();
                                log.debug('Added the holiday Timesheet-- '+timeMemo+' if id- '+savedRec+'- for employee -->',id)
                            }else{
                                log.debug('Employee '+id+'skiped as the time sheet are already created for this year.',timeMemo);
                            }
                        }
                    //}
                }
            }catch(e){
                log.debug('Error', e);
            }
        }
        function getAllResults(s) {
            var results = s.run();
            var searchResults = [];
            var searchid = 0;
            do {
                var resultslice = results.getRange({start:searchid,end:searchid+1000});
                resultslice.forEach(function(slice) {
                    searchResults.push(slice);
                    searchid++;
                    }
                );
            } while (resultslice.length >=1000);
            return searchResults;
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