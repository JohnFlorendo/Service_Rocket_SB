/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record','N/url', 'N/ui/message','N/ui/serverWidget'],
    function(record,url, message, serverWidget) {

    function beforeLoad(context) {
        var recPayCycle = context.newRecord;
        if (context.type !== context.UserEventType.VIEW) return;

        var form = context.form;
        form.addField({
            id : 'custpage_abc_text',
            type : serverWidget.FieldType.INLINEHTML,
            label : 'Inner HTML'
        }).defaultValue = "<script type='text/javascript'> setTimeout(function(){ document.getElementById('tdbody_newrecrecmachcustrecord_sr_pc_time_off_header').setAttribute('style','display:none'); document.getElementById('recmachcustrecord_sr_pc_time_off_header_existingrecmachcustrecord_sr_pc_time_off_header_fs_lbl_uir_label').parentNode.setAttribute('style','display:none'); document.getElementById('tdbody_newrecrecmachcustrecord_sr_pc_time_off_header').setAttribute('style','display:none'); document.getElementById('tdbody_attach').setAttribute('style','display:none'); document.getElementById('recmachcustrecord_sr_pc_time_off_header_searchid_fs_lbl_uir_label').parentNode.setAttribute('style','display:none'); document.getElementById('tdbody_customize').setAttribute('style','display:none'); }, 500);</script>";

        var urlLink =  getURL('customscript_lcc_sl_work_calculations','customdeploy_lcc_sl_work_calculations');
        urlLink += '&custpage_action=generatecsv';
        urlLink += '&custpage_paycyle_id='+recPayCycle.id;
        var stOnCall = "window.open('" + urlLink+ "')" ;

        if(recPayCycle.getValue('custrecord_sr_pc_status') != 4) {
            form.addButton({
                id : 'custpage_generatecsv',
                label : 'Generate CSV',
                functionName : stOnCall
            });
        }


        if(context.request.parameters.custpage_action == "GENERATED_FROM_SUITELET") {
            var myMsg = message.create({
                title: "Confirmation",
                message: "Pay Cycle has successfully been generated",
                type: message.Type.CONFIRMATION
            });

            // will disappear after 5s
            myMsg.show({ duration: 5000
            });

            context.form.addPageInitMessage({message: myMsg});
        }

        }

        function  getURL(stScript,stDeployment) {
            var urlLink =  url.resolveScript({
                scriptId: stScript,
                deploymentId: stDeployment,
                returnExternalUrl: false
            });

            return urlLink;
        }

        function afterSubmit(context) {
            var myMsg = message.create({
                title: "My Title",
                message: "My Message",
                type: message.Type.CONFIRMATION
            });

            // will disappear after 5s
            myMsg.show({
                duration: 5000
            });
        }

        return {
            beforeLoad: beforeLoad,
            afterSubmit: afterSubmit
        };

    });