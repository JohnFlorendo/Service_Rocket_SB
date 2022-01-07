/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/task','N/ui/serverWidget','N/url','../Library/lcc_lib_timemaster.js'],
    function(task,serverWidget,url,libHelper) {
        function onRequest(context) {
            if(context.request.method == 'GET'){
                var stForm = context.request.parameters['updateall'];
                log.debug('stForm',stForm);
                if(stForm == 'T'){
                    submitUpdateAll(context);
                }else{
                    buildUISelectAction(context);
                }
            }else{
                if(context.request.parameters['custpage_form'] == 'singleupdate'){
                    submitSingleUpdate(context);
                }else{
                    buildUITimeBills(context);
                }
            }
        }

        function buildUISelectAction(context) {
            var form = serverWidget.createForm('Reprocess Time Master');
            form.addSubmitButton('Reprocess a Specific Time Master');
            var urlLink = libHelper.getURL('customscript_srtm_sl_reprocess','customdeploy_srtm_sl_reprocess');
            urlLink += '&updateall=T';
            var stOnCall = "window.location.replace('"+urlLink+"');" ;
            form.addButton({
                id : 'custpage_print',
                label : 'Reprocess All Time Masters',
                functionName : stOnCall
            });
            context.response.writePage(form);
        }

        function  buildUITimeBills(context) {
            var form = serverWidget.createForm('Reprocess Time Master');
            //TYPE
            form.addField({
                id : 'custpage_form',
                type : serverWidget.FieldType.TEXT,
                label : 'Time'
            }).updateDisplayType({
                displayType : serverWidget.FieldDisplayType.HIDDEN
            }).defaultValue = 'singleupdate';

            var fieldgroup = form.addFieldGroup({
                id : 'custpage_timeentry',
                label : 'Time Entry Record'
            });
            fieldgroup.isSingleColumn = true;

            form.addField({
                id : 'custpage_time_record',
                type : serverWidget.FieldType.TEXT,
                label : 'Time Record ID '
            }).isMandatory = true;

            /*   var arrTimes = libHelper.getTimeEntries();
            var fldSelectTime = form.addField({
                  id : 'custpage_time_record',
                  type : serverWidget.FieldType.SELECT,
                  label : 'Time',
                  container : 'custpage_dateinfo'
              });

              fldSelectTime.addSelectOption({
                  value : '',
                  text : ''
              });

              if(arrTimes.length > 0){
                 for(var indx = 0; indx < arrTimes.length; indx++){
                     var stName = '['+arrTimes[indx].date+'] - ['+arrTimes[indx].hours+'] ' + arrTimes[indx].name;
                     fldSelectTime.addSelectOption({
                         value : arrTimes[indx].id,
                         text :stName
                     });
                 }
              }

              fldSelectTime.isMandatory = true;*/
            form.addSubmitButton('Submit');
            context.response.writePage(form);
        }

        function submitSingleUpdate(context) {
            var form = serverWidget.createForm('Reprocess a Specific Time Master');
            var stHTML = '';
            try{
                var stTimeId = context.request.parameters['custpage_time_record'];

                if(stTimeId) {
                    // var ssTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
                    // ssTask.scriptId = 'customscript_srtm_ss_update';
                    // ssTask.deploymentId = null;
                    // ssTask.params = {'custscript_param_timerecord_id': timeId};
                    // var ssTaskId = ssTask.submit();
                    // log.debug('ssTaskId',ssTaskId);
                    var blExistTimeEntryRecord = libHelper.checkTimeEntry(stTimeId);

                    log.debug('blExistTimeEntryRecord',blExistTimeEntryRecord);

                    if(blExistTimeEntryRecord) {
                        var stMasterId = libHelper.searchTimeMaster(stTimeId);
                        var stChargeId = libHelper.getChargeByTimeId(stTimeId);
                        if(stMasterId) {
                            if(stChargeId) {
                                log.debug('UPDATE TIME MASTER WITH CHARGE' , stChargeId);
                                libHelper.updateTimeMaster(stMasterId,stTimeId);
                            }else{
                                log.debug('NOT UPDATE TIME MASTER WITHOUT CHARGE');
                                libHelper.updateTimeMaster(stMasterId,stTimeId);
                            }
                        } else{
                            log.debug('CREATE TIME MASTER');
                            libHelper.createTimeMaster(stTimeId,stChargeId);
                        }

                        stHTML += '<div id="div__alert"><div class="uir-alert-box confirmation session_confirmation_alert" width="100%" role="status" style="">';
                        stHTML +=  '<div class="icon confirmation"><img src="/images/icons/messagebox/icon_msgbox_confirmation.png" alt=""></div>';
                        stHTML +=  '<div class="content"><div class="title">Confirmation</div><div class="descr">Done create/update Time Master Record with Time Record ['+stTimeId+']</div></div></div></div>';
                    } else {
                        stHTML += '<div id="div__alert"><div class="uir-alert-box error session_error_alert" width="100%" role="status" style="">';
                        stHTML +=  '<div class="icon error"><img src="/images/icons/messagebox/icon_msgbox_error.png" alt=""></div>';
                        stHTML +=  '<div class="content"><div class="title">Error</div><div class="descr">Invalid Time Record ID provided.</div></div></div></div>';
                    }


                }

            } catch (e) {
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

        function submitUpdateAll(context) {
            var form = serverWidget.createForm('Reprocess All Time Masters');
            var stHTML = '';
            try{
                var mrTask = task.create({ taskType: task.TaskType.MAP_REDUCE });
                mrTask.scriptId = 'customscript_srtm_mr_automapping';
                mrTask.deploymentId = 'customdeploy_srtm_mr_automapping';
                var mrTaskId = mrTask.submit();
                log.debug('mrTaskId',mrTaskId);
                if(mrTaskId){
                    stHTML += '<div id="div__alert"><div class="uir-alert-box confirmation session_confirmation_alert" width="100%" role="status" style="">';
                    stHTML +=  '<div class="icon confirmation"><img src="/images/icons/messagebox/icon_msgbox_confirmation.png" alt=""></div>';
                    stHTML +=  '<div class="content"><div class="title">Confirmation</div><div class="descr">Reprocessing all Time Master records. Please wait for 5-10 minutes to finish. </div></div></div></div>';
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
