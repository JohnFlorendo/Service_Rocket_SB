/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/runtime', '../Library/Rocket_Lib_Helper.js'],
    function (runtime, libHelper) {
        var currScript = runtime.getCurrentScript();
        
        function getInputData() {
            var arrResults = [];
            var fbWorkchatAppType = currScript.getParameter('custscript_sr_r1p_application_type');
            var stR1PEmployeeIds = currScript.getParameter('custscript_sr_mr_r1p_employee_ids');
            var objFBWorkchatAppConfig = libHelper.getFBWorkplaceApp(fbWorkchatAppType);
            log.debug('objFBWorkchatAppConfig', objFBWorkchatAppConfig);
            arrResults = consolidateInputData(objFBWorkchatAppConfig, stR1PEmployeeIds);
            
            log.debug('arrResults:', arrResults.length);
            return arrResults;
        }
        
        function consolidateInputData(objFBWorkchatAppConfig, stR1PEmployeeIds) {
            var arrResults = [];
            
            if (stR1PEmployeeIds) {
                var arrR1PEmployeeIds = stR1PEmployeeIds.split(',');
                log.debug("arrR1PEmployeeIds:", arrR1PEmployeeIds);
                arrResults = libHelper.RIPEmployeeIds(arrR1PEmployeeIds, objFBWorkchatAppConfig);
                log.debug(" stR1PEmployeeIds ,arrResults: ", arrResults);
                
                
            } else {
                arrResults = libHelper.getEmployees(objFBWorkchatAppConfig);
                log.debug("saved search:", arrResults);
            }
            
            return arrResults;
        }
        
        function map(context) {
            var arrResults = [];
            var objEmployee = JSON.parse(context.value);
            log.debug("objEmployee", objEmployee);
            var errorMessage = ""; //error message variable
            
            try {
                
                //GETTING THE INTEGRATION ACCESS
                var stR1pMessage = objEmployee.message;
                var wpConfigId = objEmployee.config
                var tractionSearchId = currScript.getParameter('custscript_r1p_traction_event_search');
                var wpConfig = libHelper.WorkplaceConfiguration(wpConfigId);
                log.debug("wpconfig", wpConfig);
                //EMPLOYEE RECORD
                log.debug('objEmployee', objEmployee);
                var stRecipient = objEmployee.workplaceid;
                log.debug('stRecipient', stRecipient);
                var stCalendar = objEmployee.calendar;
                var dtToday = new Date();
                
                var dtNextWeekDay = libHelper.getNextWeekDay(dtToday);
                var weekNum = libHelper.numberWeeks(dtNextWeekDay);
                
                var stMessages = stR1pMessage;//  'G’day Rocketeer! Here’s your R1P for Week: '+dtToday.getFullYear()+'.W' + (weekNum);
                stMessages = stMessages.replace('{year}', dtToday.getFullYear());
                stMessages = stMessages.replace('{weeknum}', weekNum);
                
                //SEND NOTIFICATION FOR UPCOMING HOLIDAYS
               /* var stNextHoliday = libHelper.sendMessage(wpConfig.Host, wpConfig.TokenKey, stRecipient, libHelper.getNextHoliday(stCalendar));
                if (stNextHoliday) {
                    log.debug('stNextHoliday', libHelper.getMessage(wpConfig.Host, wpConfig.TokenKey, stNextHoliday));
                }*/
                var sendPDF = libHelper.createWorkSchedulePDF(tractionSearchId, (weekNum), dtToday.getFullYear(), objEmployee.recipient, objEmployee.id, objEmployee.unit, objEmployee.department, objEmployee.job);// 66013;//
                // log.debug("line 63 sendPDF:",sendPDF);
                
                /*if (sendPDF) {
                    var sendAttachmentResult = libHelper.sendMessageWithAttachment(wpConfig.Host, wpConfig.TokenKey, stRecipient, null, libHelper.getPDFFile(sendPDF));
                    if (sendAttachmentResult.success) {
                        var sendMessageResult = libHelper.sendMessage(wpConfig.Host, wpConfig.TokenKey, stRecipient, stMessages); //100052008622127
                        if (sendMessageResult.success) {
                            log.debug('sendMessageResult', sendMessageResult.message_id);
                        } else {
                            //ERROR OCCURRED
                            errorMessage = JSON.stringify(sendMessageResult.message);
                        }
                    } else {
                        //ERROR OCCURRED
                        errorMessage = JSON.stringify(sendAttachmentResult.message);
                    }
                }*/
                log.debug('errorMessage', errorMessage);
            } catch (e) {
                errorMessage = e.message;
                log.debug("catch errorMessage:", errorMessage);
            }
            log.debug("sendPDF:", sendPDF);
            if (sendPDF.message) {
                errorMessage = sendPDF.message;
            }
            context.write({
                key: objEmployee.type,
                value: {
                    'recipientId': objEmployee.id,
                    'employeeName' : objEmployee.recipient,
                    'hasError': (errorMessage) ? true : false,
                    'errorMessage': errorMessage
                }
            });
        }
        
        function reduce(context) {
            log.debug('JSON.parse(context.values[0])', JSON.parse(context.values[0]));
            for (var i = 0; i < context.values.length; i++) {
                context.write({
                    key: context.key,
                    value: JSON.parse(context.values[i])
                });
            }
        }
        
        function summarize(summary) {
            try {
                var arrRecipientList = [];
                var errorCount = 0;
                var arrErrorMessage = [];
                var appType = '';
                var startDate = new Date();
                summary.output.iterator().each(function (key, value) {
                    appType = key;
                    var objResults = JSON.parse(value);
                    
                    log.debug('summarize=>objResults', objResults);
                    log.debug('summarize=>objResults', objResults.hasError);
                    arrRecipientList.push(objResults.recipientId);
                    if (objResults.hasError == true) {
                        arrErrorMessage.push({
                            recipientId: objResults.recipientId,
                            employeeName: objResults.employeeName,
                            errorMessage: objResults.errorMessage
                            
                        });
                        errorCount++;
                    }
                    return true;
                });
                
                log.debug("create record:", arrErrorMessage);
                //CREATE RECORD
                libHelper.createFBWorkplaceLog(appType, arrRecipientList, errorCount, arrErrorMessage, startDate);
            } catch (e) {
                log.debug('summarize=>error', e);
            }
        }
        
        
        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };
        
    });
