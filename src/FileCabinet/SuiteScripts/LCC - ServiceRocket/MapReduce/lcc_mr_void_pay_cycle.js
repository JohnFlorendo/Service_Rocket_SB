/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search', '../Library/lcc_lib_payroll'],
    /**
     * @param{record} record
     * @param{runtime} runtime
     * @param{search} search
     */
    function (record, runtime, search, libHelper) {
        var currentScript = runtime.getCurrentScript();


        function getInputData() {
            var stData = currentScript.getParameter({name: 'custscript_void_param_data'});

            if(stData) {
                var objData = JSON.parse(stData);
                var arrMapData = [];
                switch(objData.recordtype) {
                    case "employee":
                        /** REMOVE EMPLOYEE LISTS IN THE PAY CYCLE **/
                        var arrEmployeeAssociations = libHelper.getEmployeeAssociationsPerPayCycle(objData.intPayCycleId);
                        if(arrEmployeeAssociations.length != 0) {
                            for(var intIndex in arrEmployeeAssociations) {
                                arrMapData.push({
                                    recordid: arrEmployeeAssociations[intIndex].recordid,
                                    recordtype: objData.recordtype
                                });
                            }
                        }
                    case "paycycleline":
                        /** REMOVE PAY CYCLE LINES IN THE PAY CYCLE **/
                        var arrPayCycleLineAssociations = libHelper.getPayCycleLinesPerPayCycle(objData.intPayCycleId);
                        if(arrPayCycleLineAssociations.length != 0) {
                            for(var intIndex in arrPayCycleLineAssociations) {
                                arrMapData.push({
                                    recordid: arrPayCycleLineAssociations[intIndex].recordid,
                                    recordtype: objData.recordtype
                                });
                            }
                        }
                        break;
                    case "bonus":
                        /** REMOVE BONUS ASSOCIATION **/
                        var arrBonusAssociations = libHelper.getBonusAssociation(objData.intPayCycleId);
                        if(arrBonusAssociations.length != 0) {
                            for(var intIndex in arrBonusAssociations) {
                                arrMapData.push({
                                   recordid: arrBonusAssociations[intIndex].bonusassociationid,
                                   recordtype: objData.recordtype
                                });
                            }
                        }

                        break;
                    case "allowance":
                        // var arrPayCycleLineIds = [];
                        // var intPayCycleLineCount = parseInt(recPayCycle.getLineCount('recmachcustrecord_sr_pcl_paycycleheader'))-1;
                        // for(var intIndexPayCycleLine=intPayCycleLineCount; intIndexPayCycleLine>=0; intIndexPayCycleLine--) {
                        //     arrPayCycleLineIds.push(recPayCycle.getSublistValue('recmachcustrecord_sr_pcl_paycycleheader','id',intIndexPayCycleLine));
                        // }
                        var arrAllowancePayments = libHelper.getPayCycleAllowancePayments(objData.intPayCycleId, objData.arrPayCycleLineIds);
                        if(arrAllowancePayments.length != 0) {
                            for(var intIndex in arrAllowancePayments) {
                                arrMapData.push({
                                    recordid: arrAllowancePayments[intIndex].allowancepaymentid,
                                    recordtype: objData.recordtype
                                });
                            }
                        }
                        break;
                    case "expensereport":
                        /** REMOVE EXPENSE REPORTS TAGGING **/
                        var arrExpenseReports = libHelper.getEmployeeExpenseReportsPerPayCycle(objData.intPayCycleId);
                        if(arrExpenseReports.length != 0) {
                            for(var intIndex  in arrExpenseReports) {
                                arrMapData.push({
                                    recordid: arrExpenseReports[intIndex].recordid,
                                    recordtype: objData.recordtype
                                });
                            }
                        }
                        break;
                    case "timeoffrequest":
                        /** REMOVE TIME-OFF REQUESTS IN THE PAY CYCLE **/
                        var arrTimeOffRequestAssociations  = libHelper.getTimeOffRequestsAssociationPerPayCycle(objData.intPayCycleId);
                        if(arrTimeOffRequestAssociations.length != 0) {
                            for(var intIndex  in arrTimeOffRequestAssociations) {
                                arrMapData.push({
                                    recordid: arrTimeOffRequestAssociations[intIndex].recordid,
                                    recordtype: objData.recordtype
                                });
                            }
                        }
                        break;
                }

                // log.debug('arrMapData', arrMapData);

                return arrMapData;
            }
        }

        function map(context) {
            var objValue = JSON.parse(context.value);
            switch(objValue.recordtype) {
                case "employee":
                    /** REMOVE EMPLOYEE ASSOCIATION **/
                    record.delete({
                        type: "customrecord_sr_pay_cycle_employee",
                        id: objValue.recordid
                    });
                    break;
                case "paycycleline":
                    /** REMOVE PAY CYCLE LINE ASSOCIATION **/
                    record.delete({
                        type: "customrecord_sr_pay_cycle_lines",
                        id: objValue.recordid
                    });
                    break;
                case "bonus":
                    /** REMOVE BONUS ASSOCIATION **/
                    record.delete({
                        type: "customrecord_sr_pc_bonus_association",
                        id: objValue.recordid
                    });
                    break;
                case "allowance":
                    record.submitFields({
                        type: "customrecord_sr_pc_allowance_payment",
                        id: objValue.recordid,
                        values: { custrecord_sr_pay_cycle_header: "", custrecord_sr_pay_cycle_line_header:"" }
                    });
                    break;
                case "expensereport":
                    record.submitFields({
                        type: "expensereport",
                        id: objValue.recordid,
                        values: { custbody_sr_pay_cycle: "" }
                    });
                    break;
                case "timeoffrequest":
                    record.submitFields({
                        type: "customrecord_sr_pc_time_off_assoc",
                        id: objValue.recordid,
                        values: { custrecord_sr_pc_time_off_header: "" }
                    });
                    break;
            }
        }

        function summarize(summary) {
            log.debug('Input Error', summary.inputSummary.error);
            summary.mapSummary.errors.iterator().each(function (key, error) {
                log.debug('Map Error for key: ' + key, error);
                return true;
            });
        }

        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        };

    });
