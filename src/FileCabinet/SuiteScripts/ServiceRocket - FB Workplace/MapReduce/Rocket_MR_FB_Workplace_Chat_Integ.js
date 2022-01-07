/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/runtime','../Library/Rocket_Lib_Helper.js'],
function(runtime,libHelper) {
    var currScript = runtime.getCurrentScript();
    function getInputData() {
        var searchId = currScript.getParameter('custscript_r1p_search');
        var arrRequest = libHelper.getEmployees(searchId);
        log.debug('arrRequest',arrRequest.length);
        return arrRequest;
    }
    function map(context) {
        try{
            var objEmployee = JSON.parse(context.value);
            //GETTING THE INTEGRATION ACCESS
            var stR1pMessage = currScript.getParameter('custscript_r1p_wp_fb_chat_message');
            var wpConfigId = currScript.getParameter('custscript_r1p_config_access');
            var tractionSearchId = currScript.getParameter('custscript_r1p_traction_event_search');
            var wpConfig = libHelper.WorkplaceConfiguration(wpConfigId);
            //EMPLOYEE RECORD
            log.debug('objEmployee',objEmployee);
            var stRecipient = objEmployee.workplaceid;
            var stCalendar = objEmployee.calendar;
            var dtToday = new Date();

            var dtNextWeekDay = libHelper.getNextWeekDay(dtToday);
            var weekNum = libHelper.numberWeeks(dtNextWeekDay);

            var stMessages = stR1pMessage;//  'G’day Rocketeer! Here’s your R1P for Week: '+dtToday.getFullYear()+'.W' + (weekNum);
            stMessages = stMessages.replace('{year}',dtToday.getFullYear());
            stMessages = stMessages.replace('{weeknum}',weekNum);

            var stMessageId = libHelper.sendMessage(wpConfig.Host,wpConfig.TokenKey,stRecipient,stMessages); //100052008622127

            /*var stNextHoliday = libHelper.sendMessage(wpConfig.Host,wpConfig.TokenKey,stRecipient,libHelper.getNextHoliday(stCalendar));
            if(stNextHoliday){
                //log.debug('stNextHoliday',libHelper.getMessage(wpConfig.Host,wpConfig.TokenKey,stNextHoliday));
            }*/
            var sendPDF =  libHelper.createWorkSchedulePDF(tractionSearchId,(weekNum),dtToday.getFullYear(),objEmployee.name,objEmployee.id);// 66013;//
            if(sendPDF){
                var stMessageAttachedId = libHelper.sendAttachment(wpConfig.Host,wpConfig.TokenKey,stRecipient,libHelper.getPDFFile(sendPDF));
                if(stMessageAttachedId){
                    //log.debug('stMessageAttachedId',stMessageAttachedId);
                    var stMessageID = libHelper.sendMessageWithAttachment(wpConfig.Host,wpConfig.TokenKey,stRecipient,stMessageAttachedId,libHelper.getPDFFile(sendPDF));
                    if(stMessageID){
                        log.debug('stMessageAttachedId',stMessageID);
                    }
                }
            }
        }catch (e) {
            log.debug('Error-Map',e);
        }
    }
    function reduce(context) {

    }
    function summarize(summary) {

    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
});
