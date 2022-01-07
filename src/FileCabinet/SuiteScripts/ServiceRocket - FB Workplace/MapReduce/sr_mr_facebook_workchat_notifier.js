/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/runtime','../Library/Rocket_Lib_Helper.js'],

function(runtime,libHelper) {
    var currScript = runtime.getCurrentScript();

    function getInputData() {
        var arrResults = [];
        try {
            var fbWorkchatAppType = currScript.getParameter('custscript_sr_fb_wc_application_type');
            if(fbWorkchatAppType){
                var objFBWorkchatAppConfig =  libHelper.getFBWorkplaceApp(fbWorkchatAppType);
                log.debug('objFBWorkchatAppConfig',objFBWorkchatAppConfig);
                arrResults = consolidateInputData(objFBWorkchatAppConfig);
            }
        }catch (e) {
            log.debug('getInputData',e);
        }

        log.debug('arrResults',arrResults);

        return arrResults;
    }

    function map(context) {
        try {

            //GETTING THE INTEGRATION ACCESS
            var objMessage = JSON.parse(context.value);
            var wpConfigId = objMessage.config; //currScript.getParameter('custscript_timeoff_config_access');
            var wpConfig = libHelper.WorkplaceConfiguration(wpConfigId);
            var dynamicHostURL = libHelper.getHostUrl();
            log.debug('dynamicHostURL',dynamicHostURL);

            var errorMessage = '';
            switch (objMessage.type) {
                case 'timeoffrequest':
                    errorMessage = sendTimeOffRequest(objMessage,wpConfig.Host,wpConfig.TokenKey,dynamicHostURL);
                    break;
                case 'timebill' :
                    errorMessage = sendTimeEntries(objMessage,wpConfig.Host,wpConfig.TokenKey,dynamicHostURL);
                    break;
                case 'weeklytimebill' :
                    errorMessage = sendIncompleteTimeSheet(objMessage,wpConfig.Host,wpConfig.TokenKey,dynamicHostURL);
                    break;
            }

            context.write({
                key : objMessage.type,
                value : {
                    'recipientId' : objMessage.recipient,
                    'hasError' : (errorMessage) ? true : false,
                    'errorMessage' : errorMessage
                }
            });

        }catch (e) {
            log.debug('map',e);
        }


    }

    function reduce(context) {
        log.debug('JSON.parse(context.values[0])',JSON.parse(context.values[0]));
        for (var i = 0; i < context.values.length; i++) {
         context.write({
             key : context.key,
             value : JSON.parse(context.values[i])
         });
        }

    }
    function summarize(summary) {
        try{
            var arrRecipientList = [];
            var errorCount = 0;
            var arrErrorMessage = [];
            var appType = '';
            var startDate = new Date();
            summary.output.iterator().each(function (key, value)
            {
                appType = key;
                var objResults = JSON.parse(value);
                log.debug('summarize=>objResults',objResults);
                arrRecipientList.push(objResults.recipientId);
                if(objResults.hasError){
                    arrErrorMessage.push({
                        recipientId : objResults.recipientId,
                        objResults : objResults.errorMessage
                    });
                    errorCount++;
                }
                return true;
            });

            //CREATE RECORD
            libHelper.createFBWorkplaceLog(appType,arrRecipientList,errorCount,arrErrorMessage,startDate);
        }catch (e) {
            log.debug('summarize=>error',e);
        }
    }
    
    function consolidateInputData(objFBWorkchatAppConfig) {
        var arrResults = [];
        switch (objFBWorkchatAppConfig.type) {
            case 'timeoffrequest' :
                arrResults = libHelper.getRequestTimeOff(objFBWorkchatAppConfig);
                break;
            case 'timebill' :
                arrResults = libHelper.getTimeEntries(objFBWorkchatAppConfig);
                break;
            case 'weeklytimebill' :
                arrResults = libHelper.getIncompleteTimeSheet(objFBWorkchatAppConfig);
                break;
        }

        return arrResults;
    }

    function sendTimeOffRequest(objRequestTimeOff,Host,TokenKey,dynamicHostURL) {
        var stResult = '';
        try{
            var stTORMessages = objRequestTimeOff.message;
            stTORMessages = stTORMessages.replace('{recipientname}',objRequestTimeOff.recipientname);
            stTORMessages = stTORMessages.replace('{count}',objRequestTimeOff.count);
            stTORMessages = stTORMessages.replace('{DYNAMICURL}',dynamicHostURL);
            var stRecipient = libHelper.getWorKPlaceIdByEmployee(objRequestTimeOff.recipient);//100013790623295;//100052008622127;
            //log.debug('stRecipient',stRecipient);
            if(stRecipient){
                var stMessageId = libHelper.sendMessage(Host,TokenKey,stRecipient,stTORMessages); //100052008622127
                //log.debug('sendTimeOffRequest=>stMessageId',stMessageId);
                var resLog = libHelper.getMessage(Host,TokenKey,stMessageId);
                log.debug('resLog',resLog);
            }else{
                throw {
                    recipient : objRequestTimeOff.recipientname,
                    message : 'NO WORKPLACE ID FOUND'
                };
            }
        }catch (e) {
            stResult = e;
        }

        return stResult;
    }

    function sendTimeEntries(objTimeEntries,Host,TokenKey,dynamicHostURL) {
        var stResult = '';
        try {
            var stTEMessages = objTimeEntries.message;
            stTEMessages = stTEMessages.replace('{recipientname}', objTimeEntries.recipientname);
            stTEMessages = stTEMessages.replace('{count}', objTimeEntries.count);
            stTEMessages = stTEMessages.replace('{DYNAMICURL}',dynamicHostURL);

            var stRecipient = libHelper.getWorKPlaceIdByEmployee(objTimeEntries.recipient);//100013790623295;//100052008622127;
            if (stRecipient) {
                var stMessageId = libHelper.sendMessage(Host, TokenKey, stRecipient, stTEMessages); //100052008622127
                //log.debug('sendTimeEntries=>stMessageId',stMessageId);
                var resLog = libHelper.getMessage(Host, TokenKey, stMessageId);
                log.debug('resLog', resLog);
            } else {
                throw {
                    recipient: objTimeEntries.recipientname,
                    message: 'NO WORKPLACE ID FOUND'
                };
            }
        } catch (e) {
            stResult = e.message;
        }
        return stResult;
    }

    function sendIncompleteTimeSheet(objTimeSheet,Host,TokenKey,dynamicHostURL) {
        var stResult = '';
        try{
            var stTEMessages = objTimeSheet.message;
            stTEMessages = stTEMessages.replace('{recipientname}',objTimeSheet.recipientname);
            stTEMessages = stTEMessages.replace('{count}',objTimeSheet.count);
            stTEMessages = stTEMessages.replace('{DYNAMICURL}',dynamicHostURL);

            var stRecipient = libHelper.getWorKPlaceIdByEmployee(objTimeSheet.recipient);//100013790623295;//100052008622127;
            if(stRecipient){
                var stMessageId = libHelper.sendMessage(Host,TokenKey,stRecipient,stTEMessages); //100052008622127
                //log.debug('sendIncompleteTimeSheet=>stMessageId',stMessageId);
                var resLog = libHelper.getMessage(Host,TokenKey,stMessageId);
                log.debug('resLog',resLog);
            }else{
                throw {
                    recipient: objTimeSheet.recipientname,
                    message: 'NO WORKPLACE ID FOUND'
                };
            }
        }catch (e) {
            stResult = e.message;
        }

        return stResult;
    }





    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
});
