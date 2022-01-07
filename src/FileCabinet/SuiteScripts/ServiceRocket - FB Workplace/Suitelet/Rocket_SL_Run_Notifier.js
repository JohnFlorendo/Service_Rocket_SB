/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/runtime', 'N/task','N/ui/serverWidget','N/file','N/search','N/url'],
/**
 * @param{runtime} runtime
 * @param{task} task
 * @param{serverWidget} serverWidget
 */
function(runtime, task,serverWidget,file,search,url) {
    function onRequest(context) {
        var objRequest = context.request;
        if(objRequest.method == 'GET'){
            buildDefaultForm(context);
        }else{
            if(objRequest.parameters['custpage_formtype'] == 'form_select_app'){
                buildConfirmForm(context);
            }else if(objRequest.parameters['custpage_formtype'] == 'form_confirm_app'){
                sendNotification(context);
            }
            //
        }
    }

    function buildDefaultForm(context) {
        var form = serverWidget.createForm('Workplace Time-Off Notifier');

        form.addFieldGroup({
            id : 'custpage_filter',
            label : "Filter"
        });

       form.addField({
            id :'custpage_formtype',
            type : serverWidget.FieldType.TEXT,
            label: 'Form',
            container : 'custpage_filter'
        }).updateDisplayType({
           displayType : serverWidget.FieldDisplayType.HIDDEN
       }).defaultValue = 'form_select_app';


        var fldSelect = form.addField({
            id :'custpage_select_apptype',
            type : serverWidget.FieldType.SELECT,
            label: 'Application Type',
            container : 'custpage_filter'
        });
        var objAppType = searchFBworkplaceApp();
        fldSelect.addSelectOption({
            value : '',
            text : '--Select--'
        });

        for (var objApp in objAppType){
            fldSelect.addSelectOption({
                value : objApp,
                text : objAppType[objApp].name
            });
        }

        form.addSubmitButton('Select');
        context.response.writePage(form);
    }

    function  buildConfirmForm(context) {
        var selectAppId = context.request.parameters['custpage_select_apptype'];
        var objAppType = searchFBworkplaceApp();
        var formTitle = 'Workplace '+ objAppType[selectAppId].name;
        var tempMessage = '';
        tempMessage = file.load({
            id : '../Template/temp_sl_fb_workplace_notifier.html'
        }).getContents();

        //CREATE FORM
        var form = serverWidget.createForm(formTitle);

        form.addField({
            id :'custpage_select_apptype',
            type : serverWidget.FieldType.TEXT,
            label: 'Application Type',
            container : 'custpage_filter'
        }).updateDisplayType({
            displayType : serverWidget.FieldDisplayType.HIDDEN
        }).defaultValue = selectAppId;

        form.addField({
            id :'custpage_formtype',
            type : serverWidget.FieldType.TEXT,
            label: 'Form',
            container : 'custpage_filter'
        }).updateDisplayType({
            displayType : serverWidget.FieldDisplayType.HIDDEN
        }).defaultValue = 'form_confirm_app';


        //SEARCH THE ID

        var searchURL = 'https://';
        searchURL +=  url.resolveDomain({
            hostType: url.HostType.APPLICATION
        });
        searchURL += '/app/common/search/searchresults.nl?';
        searchURL += 'searchid='+objAppType[selectAppId].searchid+'&whence=';

        tempMessage = tempMessage.replace('{appname}',objAppType[selectAppId].name);
        tempMessage = tempMessage.replace('{searchurl}',searchURL);
        form.addField({
            id : 'custpage_inline',
            type : serverWidget.FieldType.INLINEHTML,
            label : 'Inline'
        }).defaultValue = tempMessage;
        form.addSubmitButton('Confirm');
        form.addButton({
            id : 'custpage_btn_back',
            label : 'Back',
            functionName : ''
        })
        context.response.writePage(form);
    }
    
    function searchFBworkplaceApp() {
        var objResults = {};
        try{
            var searchFBworkplaceAppObj = search.create({
                type: "customrecord_sr_fb_wc_application_type",
                filters:
                    [
                        ["custrecord_sr_fb_wc_app_type","isnot","r1p"]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC
                        }),
                        "scriptid",
                        "custrecord_sr_fb_wc_rec_saved_search"
                    ]
            });
            searchFBworkplaceAppObj.run().each(function(result){
                // .run().each has a limit of 4,000 results
                if(objResults[result.id] == null){
                    objResults[result.id] = {
                        name : result.getValue('name'),
                        searchid : result.getValue('custrecord_sr_fb_wc_rec_saved_search')
                    }
                }
                return true;
            });
        }catch (e) {
            log.debug('searchFBworkplaceApp=>e',e);
        }
        return objResults;
    }

    function sendNotification(context) {
        var objRequest = context.request;
        var selectAppId = objRequest.parameters['custpage_select_apptype'];
        var objAppType = searchFBworkplaceApp();
        var formTitle = 'Workplace '+ objAppType[selectAppId].name;
        var form = serverWidget.createForm(formTitle);
        var stHTML = '';
        try{
            if(selectAppId){
                var mrTask = task.create({ taskType: task.TaskType.MAP_REDUCE });
                mrTask.scriptId = 'customscript_sr_mr_fb_workchat_notifier';
                mrTask.deploymentId = null;
                mrTask.params = {
                    custscript_sr_fb_wc_application_type : selectAppId
                }
                var mrTaskId = mrTask.submit();
                log.debug('mrTaskId',mrTaskId);
                if(mrTaskId){
                    stHTML += '<div id="div__alert"><div class="uir-alert-box confirmation session_confirmation_alert" width="100%" role="status" style="">';
                    stHTML +=  '<div class="icon confirmation"><img src="/images/icons/messagebox/icon_msgbox_confirmation.png" alt=""></div>';
                    stHTML +=  '<div class="content"><div class="title">Confirmation</div><div class="descr">Sending notifications.. Please wait for 2-5 minutes to finish. </div></div></div></div>';
                }
            }

        }catch (e) {
            stHTML += '<div id="div__alert"><div class="uir-alert-box error session_error_alert" width="100%" role="status" style="">';
            stHTML +=  '<div class="icon error"><img src="/images/icons/messagebox/icon_msgbox_error.png" alt=""></div>';
            stHTML +=  '<div class="content"><div class="title">Error</div><div class="descr">'+ e.message +'</div></div></div></div>';
        }

        form.addField({
            id : 'custpage_message',
            type : serverWidget.FieldType.INLINEHTML,
            label : 'HTML'
        }).defaultValue = stHTML;
        context.response.writePage(form);
    }

    return {
        onRequest: onRequest
    };
    
});
