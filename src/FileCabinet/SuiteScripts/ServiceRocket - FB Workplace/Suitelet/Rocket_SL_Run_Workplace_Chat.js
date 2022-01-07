/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/runtime', 'N/task','N/ui/serverWidget'],
/**
 * @param{runtime} runtime
 * @param{task} task
 * @param{serverWidget} serverWidget
 */
function(runtime, task,serverWidget) {
    function onRequest(context) {
        if(context.request.method == 'GET'){
            buildForm(context);
        }else{
            sendFBChat(context);
        }
    }

    function  buildForm(context) {
        var form = serverWidget.createForm('Send R1P');
        form.addSubmitButton('Send');
        context.response.writePage(form);
    }

    function sendFBChat(context) {
        var form = serverWidget.createForm('Send R1P');
        var stHTML = '';
        try{
            var mrTask = task.create({ taskType: task.TaskType.MAP_REDUCE });
            mrTask.scriptId = 'customscript_sr_mr_r1p_fb_notifier';
            mrTask.deploymentId = null;
            var mrTaskId = mrTask.submit();
            log.debug('mrTaskId',mrTaskId);
            if(mrTaskId){
                stHTML += '<div id="div__alert"><div class="uir-alert-box confirmation session_confirmation_alert" width="100%" role="status" style="">';
                stHTML +=  '<div class="icon confirmation"><img src="/images/icons/messagebox/icon_msgbox_confirmation.png" alt=""></div>';
                stHTML +=  '<div class="content"><div class="title">Confirmation</div><div class="descr">Sending Facebook Workplace Notification. Please wait for 2-5 minutes to complete and navigate to this <a href="https://3688201.app.netsuite.com/app/common/media/mediaitemfolders.nl?folder=6061">folder</a> </div></div></div></div>';
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
