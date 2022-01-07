    /**
     * @NApiVersion 2.x
     * @NScriptType ScheduledScript
     * @NModuleScope SameAccount
     */
    define(['N/record', 'N/render','N/file','N/search','N/ui/serverWidget', '../Library/lcc_lib_payroll', 'N/runtime','N/file'],
        function(record, render,file,search,serverWidget, libHelper, runtime,file) {

            var currentScript = runtime.getCurrentScript();
            function execute(scriptContext) {
                try {
                    var stData = currentScript.getParameter({ name: 'custscript_data' });
                    var objCurrencies = libHelper.getCurrencies();
                    if(stData != "") {
                        var US_NETSUITE_PAYROLL_PROVIDER_ID = 9;
                        var objData = JSON.parse(stData);
                        var arrEmployees = [];
                        var recPayCycle = record.load({type: "customrecord_sr_pay_cycle", id: objData.intPayCycle, isDynamic: true });
                        var objTimeOffTypes = libHelper.getTimeOffTypes();
                        var payrollprovider = recPayCycle.getValue('custrecord_payroll_provider');
                        var recPayrollProvider = record.load({type: "customrecord_payroll_provider", id: payrollprovider, isDynamic: true });
                        var arrTimeOffTypes = recPayrollProvider.getText('custrecord_timeoff_types');
                        var objPayCodes = {};
                        var objCostCenterOverride = {};
                        var objAllowancesOverride = {};
                        var arrEmployeeListPayroll = [];

                        if(recPayrollProvider.getValue('custrecord_sr_cost_center_override') != '') { objCostCenterOverride = JSON.parse(recPayrollProvider.getValue('custrecord_sr_cost_center_override')); }
                        if(recPayrollProvider.getValue('custrecord_sr_pp_paycode_id') != '') { objPayCodes = JSON.parse(recPayrollProvider.getValue('custrecord_sr_pp_paycode_id')); }
                        if(recPayrollProvider.getValue('custrecord_sr_allowance_override') != '') { objAllowancesOverride = JSON.parse(recPayrollProvider.getValue('custrecord_sr_allowance_override')); }

                        // for(var intIndex in objTimeOffTypes) { arrTimeOffTypes.push(objTimeOffTypes[intIndex].recordid); }
                        // var arrTimeOffRequests = libHelper.findApprovedTimeOffRequests(arrTimeOffTypes, payrollprovider, objData.startdate,objData.enddate);
                        var objEmployeePayroll = libHelper.getAllEmployeesPayroll(objData.startdate, objData.enddate, payrollprovider);
                        var objEmployeeData = libHelper.getPayrollData(objEmployeePayroll, payrollprovider, objData.startdate, objData.enddate);

                        /** APPEND EMPLOYEE DATA **/
                        if(objData.arrEmployees != "") {
                            var arrEmployeeData = JSON.parse(objData.arrEmployees);
                            for(var intIndex=0; intIndex<arrEmployeeData.length; intIndex++) {
                                var currentLine = recPayCycle.selectNewLine({ sublistId: 'recmachcustrecord_sr_pc_pay_cycle_header' });
                                arrEmployeeListPayroll.push(arrEmployeeData[intIndex].employeeid);
                                currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pc_pay_cycle_header', fieldId: 'custrecord_sr_pc_emp_employee', value: arrEmployeeData[intIndex].employeeid });
                                currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pc_pay_cycle_header', fieldId: 'custrecord_sr_pc_cost_center', value: arrEmployeeData[intIndex].costcenter });
                                currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pc_pay_cycle_header', fieldId: 'custrecord_sr_pc_pay_cycle_header', value: objData.intPayCycle });
                                currentLine.commitLine({ sublistId: 'recmachcustrecord_sr_pc_pay_cycle_header' });
                                arrEmployees.push(arrEmployeeData[intIndex].employeeid);
                            }
                        }

                        var arrBonuses = libHelper.getEmployeeBonuses(arrEmployees, recPayCycle.getText('custrecord_sr_pc_start_date'), recPayCycle.getText('custrecord_sr_pc_end_date'));

                        /** ADD BONUSES IN THE PAY CYCLE LINE **/
                        if(arrBonuses.length != 0) {
                            var intBonusPaycodeId = '10524';

                            for(var intIndex in arrBonuses) {
                                var flUSDRate = libHelper.getUSDCurrencyRate('bonus',arrBonuses[intIndex].bonuscurrency, objCurrencies, recPayCycle.getText('custrecord_sr_pc_start_date'), recPayCycle.getText('custrecord_sr_pc_end_date'));
                                if(payrollprovider != 1) { intBonusPaycodeId = arrBonuses[intIndex].bonustype; }
                                var intEmpId = arrBonuses[intIndex].bonusemployee;
                                if(objEmployeeData[intEmpId] == null) { objEmployeeData[intEmpId] = { data:[] }; }
                                var stCode = (typeof objEmployeeData[intEmpId].data[0] == 'undefined') ? "" : objEmployeeData[intEmpId].data[0].code;
                                var stCostCenter = (typeof objEmployeeData[intEmpId].data[0] == 'undefined') ? "" : objEmployeeData[intEmpId].data[0].cost_center;
                                var dtStartDate = (typeof objEmployeeData[intEmpId].data[0] == 'undefined') ? "" : objEmployeeData[intEmpId].data[0].payroll_start;
                                var dtEndDate = (typeof objEmployeeData[intEmpId].data[0] == 'undefined') ? "" : objEmployeeData[intEmpId].data[0].payroll_end;

                                /** ADD THE BONUS IN THE OBJECT IF BONUS STATUS IS READY TO PAY **/
                                if(arrBonuses[intIndex].bonusstatus == 'ready_to_pay') {
                                    objEmployeeData[intEmpId].data.push({
                                        code: stCode,
                                        cost_center: stCostCenter,
                                        paycode_id: intBonusPaycodeId,
                                        total_working_hours: arrBonuses[intIndex].bonusamountabsolute,
                                        payroll_start: dtStartDate,
                                        payroll_end: dtEndDate,
                                        leave_start: "",
                                        leave_end: "",
                                        number_pays: '1.00',
                                        alter_rate: 0,
                                        bonusid: arrBonuses[intIndex].bonusid,
                                        bonustype: arrBonuses[intIndex].bonustypeid,
                                        usd_amount: parseFloat(flUSDRate * arrBonuses[intIndex].bonusamountabsolute)
                                    });
                                }
                            }
                        }

                        if(recPayCycle.getValue('custrecord_payroll_provider') != US_NETSUITE_PAYROLL_PROVIDER_ID) {
                            /** ADD THE EXPENSES REPORT IN THE OBJECT **/
                            var arrExpenseReports = libHelper.getEmployeeExpenseReports(arrEmployees, recPayCycle.getText('custrecord_sr_pc_start_date'), recPayCycle.getText('custrecord_sr_pc_end_date'));

                            /** ADD EXPENSES REPORT IN THE PAY CYCLE LINE **/
                            if(arrExpenseReports.length != 0) {
                                var intExpenseReportPaycodeId = '267507';
                                for(var intIndex in arrExpenseReports) {
                                    if(arrExpenseReports[intIndex].status != "paidInFull") {
                                        if(payrollprovider != 1) { intExpenseReportPaycodeId = "Expense Reimbursement"; }
                                        var intEmpId = arrExpenseReports[intIndex].entityid;
                                        if(objEmployeeData[intEmpId] == null) { objEmployeeData[intEmpId] = { data:[] }; }
                                        var stCode = (typeof objEmployeeData[intEmpId].data[0] == 'undefined') ? "" : objEmployeeData[intEmpId].data[0].code;
                                        var stCostCenter = (typeof objEmployeeData[intEmpId].data[0] == 'undefined') ? "" : objEmployeeData[intEmpId].data[0].cost_center;
                                        var dtStartDate = (typeof objEmployeeData[intEmpId].data[0] == 'undefined') ? "" : objEmployeeData[intEmpId].data[0].payroll_start;
                                        var dtEndDate = (typeof objEmployeeData[intEmpId].data[0] == 'undefined') ? "" : objEmployeeData[intEmpId].data[0].payroll_end;
                                        objEmployeeData[intEmpId].data.push({
                                            code: stCode,
                                            cost_center: stCostCenter,
                                            paycode_id: intExpenseReportPaycodeId,
                                            total_working_hours: arrExpenseReports[intIndex].fxamount,
                                            payroll_start: dtStartDate,
                                            payroll_end: dtEndDate,
                                            leave_start: "",
                                            leave_end: "",
                                            number_pays: '1.00',
                                            alter_rate: 0,
                                            expensereportid: arrExpenseReports[intIndex].recordid
                                        });

                                        /** LINK PAY CYCLE TO EXPENSE REPORTS **/
                                        record.submitFields({
                                            type: "expensereport",
                                            id: arrExpenseReports[intIndex].recordid,
                                            values: { custbody_sr_pay_cycle: objData.intPayCycle }
                                        });
                                    }
                                }
                            }

                            /** ADD COMMISSIONS IN THE OBJECT **/
                            // var arrCommissions = libHelper.getEmployeeCommissions(arrEmployees, recPayCycle.getText('custrecord_sr_pc_start_date'), recPayCycle.getText('custrecord_sr_pc_end_date'));

                            /** ADD COMMISSIONS IN THE PAY CYCLE LINE **/
                            // if(arrCommissions.length != 0) {
                            //     var intCommissionPaycodeId = '14378';
                            //     for(var intIndex in arrCommissions) {
                            //         if(arrCommissions[intIndex].status != "paidInFull") {
                            //             var intEmpId = arrCommissions[intIndex].entityid;
                            //             if(objEmployeeData[intEmpId] == null) { objEmployeeData[intEmpId] = { data:[] }; }
                            //             var stCode = (typeof objEmployeeData[intEmpId].data[0] == 'undefined') ? "" : objEmployeeData[intEmpId].data[0].code;
                            //             var stCostCenter = (typeof objEmployeeData[intEmpId].data[0] == 'undefined') ? "" : objEmployeeData[intEmpId].data[0].cost_center;
                            //             var dtStartDate = (typeof objEmployeeData[intEmpId].data[0] == 'undefined') ? "" : objEmployeeData[intEmpId].data[0].payroll_start;
                            //             var dtEndDate = (typeof objEmployeeData[intEmpId].data[0] == 'undefined') ? "" : objEmployeeData[intEmpId].data[0].payroll_end;
                            //             objEmployeeData[intEmpId].data.push({
                            //                 code: stCode,
                            //                 cost_center: stCostCenter,
                            //                 paycode_id: intCommissionPaycodeId,
                            //                 total_working_hours: arrCommissions[intIndex].fxamount,
                            //                 payroll_start: dtStartDate,
                            //                 payroll_end: dtEndDate,
                            //                 leave_start: "",
                            //                 leave_end: "",
                            //                 number_pays: '1.00',
                            //                 alter_rate: 0,
                            //                 commissionid:arrCommissions[intIndex].recordid
                            //             });
                            //         }
                            //     }
                            // }
                        }

                        /** APPEND PAY CYCLE LINES**/
                        for(var intIndex in objEmployeeData) {
                            for(var intIndexData in objEmployeeData[intIndex].data) {
                                var currentLine = recPayCycle.selectNewLine({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader' });
                                currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_employee_id', value: intIndex });
                                currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_employee_code', value: objEmployeeData[intIndex].data[intIndexData].code });
                                currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_cost_center_code', value: objEmployeeData[intIndex].data[intIndexData].cost_center });
                                currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_paycode_id', value: objEmployeeData[intIndex].data[intIndexData].paycode_id });
                                currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_quantity', value: parseFloat(objEmployeeData[intIndex].data[intIndexData].total_working_hours).toFixed(2) });
                                currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_payroll_start', value: objEmployeeData[intIndex].data[intIndexData].payroll_start });
                                currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_end', value: objEmployeeData[intIndex].data[intIndexData].payroll_end });
                                currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_leave_start', value: objEmployeeData[intIndex].data[intIndexData].leave_start });
                                currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_leave_end', value: objEmployeeData[intIndex].data[intIndexData].leave_end });
                                currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_number_pays', value: objEmployeeData[intIndex].data[intIndexData].number_pays });
                                currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_alternative_rate', value: objEmployeeData[intIndex].data[intIndexData].alter_rate });

                                if(typeof objEmployeeData[intIndex].data[intIndexData].bonusid != 'undefined') {
                                    currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_bonus', value: objEmployeeData[intIndex].data[intIndexData].bonusid });
                                }

                                if(typeof objEmployeeData[intIndex].data[intIndexData].bonustype != 'undefined') {
                                    currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_bonus_type', value: objEmployeeData[intIndex].data[intIndexData].bonustype });
                                }

                                if(typeof objEmployeeData[intIndex].data[intIndexData].usd_amount != 'undefined') {
                                    currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_usd_amount', value: objEmployeeData[intIndex].data[intIndexData].usd_amount });
                                }

                                if(typeof objEmployeeData[intIndex].data[intIndexData].expensereportid != 'undefined') {
                                    currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_expense_report', value: objEmployeeData[intIndex].data[intIndexData].expensereportid });
                                }

                                if(typeof objEmployeeData[intIndex].data[intIndexData].commissionid != 'undefined') {
                                    currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_commission', value: objEmployeeData[intIndex].data[intIndexData].commissionid });
                                }


                                if(typeof objEmployeeData[intIndex].data[intIndexData].timeoffrequestassociationid != 'undefined') {
                                    currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_timeoff_association', value: objEmployeeData[intIndex].data[intIndexData].timeoffrequestassociationid });
                                }

                                if(typeof objEmployeeData[intIndex].data[intIndexData].isparent_row != 'undefined') {
                                    currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pc_is_parent_row', value: objEmployeeData[intIndex].data[intIndexData].isparent_row });
                                }

                                var currentLineObj = currentLine.commitLine({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader' });
                            }
                        }

                        var arrAllowances = libHelper.getEmployeeAllowances(arrEmployees, recPayCycle.getText('custrecord_sr_pc_start_date'), recPayCycle.getText('custrecord_sr_pc_end_date'));

                        /** CREATE PAY CYCLE LINE AND PAY CYCLE ALLOWANCE PAYMENT **/
                        if(arrAllowances.length != 0) {
                            for(var intIndex in arrAllowances) {
                                var flUSDRate = libHelper.getUSDCurrencyRate('allowance', arrAllowances[intIndex].allowancecurrency, objCurrencies, recPayCycle.getText('custrecord_sr_pc_start_date'), recPayCycle.getText('custrecord_sr_pc_end_date'));
                                log.debug(arrAllowances,flUSDRate);

                                var now = new Date();
                                var stCode = (typeof objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0] == 'undefined') ? "" : objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0].code;
                                var stCostCenter = (typeof objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0] == 'undefined') ? "" : objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0].cost_center;
                                // var stPayCode = (typeof objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0] == 'undefined') ? "" : objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0].paycode_id;
                                var stPayCode = (objAllowancesOverride[arrAllowances[intIndex].allowancetypetext] == null) ? arrAllowances[intIndex].allowancetypetext : objAllowancesOverride[arrAllowances[intIndex].allowancetypetext];
                                var dtStartDate = (typeof objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0] == 'undefined') ? "" : objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0].payroll_start;
                                var dtEndDate = (typeof objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0] == 'undefined') ? "" : objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0].payroll_end;
                                var recPayCycleLine = record.create({ type: "customrecord_sr_pay_cycle_lines", isDynamic: true });
                                recPayCycleLine.setValue('custrecord_sr_pcl_paycycleheader', recPayCycle.id);
                                recPayCycleLine.setValue('custrecord_sr_pcl_employee_id', arrAllowances[intIndex].allowanceemployee);
                                recPayCycleLine.setValue('custrecord_sr_pcl_employee_code', stCode);
                                recPayCycleLine.setValue('custrecord_sr_pcl_cost_center_code', stCostCenter);
                                recPayCycleLine.setValue('custrecord_sr_pcl_paycode_id', stPayCode);
                                recPayCycleLine.setValue('custrecord_sr_pcl_quantity', arrAllowances[intIndex].allowanceamount);
                                recPayCycleLine.setValue('custrecord_sr_pcl_payroll_start', dtStartDate);
                                recPayCycleLine.setValue('custrecord_sr_pcl_end', dtEndDate);
                                recPayCycleLine.setValue('custrecord_leave_start', '');
                                recPayCycleLine.setValue('custrecord_leave_end', '');
                                recPayCycleLine.setValue('custrecord_number_pays', '1.00');
                                recPayCycleLine.setValue('custrecord_alternative_rate', 0);
                                recPayCycleLine.setValue('custrecord_sr_pcl_allowance', arrAllowances[intIndex].allowanceid);
                                recPayCycleLine.setValue('custrecord_sr_pcl_usd_amount', parseFloat(flUSDRate * arrAllowances[intIndex].allowanceamount));
                                var intPayCycleLineId = recPayCycleLine.save();

                                /** PAY CYCLE ALLOWANCE PAYMENT **/
                                var recPayCycleAllowancePayment = record.create({ type: "customrecord_sr_pc_allowance_payment", isDynamic: true });
                                recPayCycleAllowancePayment.setValue('custrecord_sr_pay_cycle_header', recPayCycle.id);
                                recPayCycleAllowancePayment.setValue('custrecord_sr_pay_cycle_line_header', intPayCycleLineId);
                                recPayCycleAllowancePayment.setValue('custrecord_sr_allowance_amount_paid', arrAllowances[intIndex].allowanceamount);
                                recPayCycleAllowancePayment.setValue('custrecord_sr_allowance_date_paid', now);
                                recPayCycleAllowancePayment.save();
                            }
                        }

                        recPayCycle.save();

                        /** APPEND TIME-OFF REQUESTS **/
                        var arrTimeOffRequestsAssociation = libHelper.getTimeOffRequestsAssociationLists(recPayrollProvider.getValue('custrecord_timeoff_types'), arrEmployeeListPayroll, objData.startdate,objData.enddate);
                        if(arrTimeOffRequestsAssociation.length != 0) {
                            for(var intIndex in arrTimeOffRequestsAssociation) {
                                if(libHelper.existInArrTimeOffTypes(arrTimeOffTypes, arrTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name)) {
                                    if(payrollprovider == 1) {
                                        if(typeof objPayCodes[arrTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name] != 'undefined') {
                                            stPayCode = objPayCodes[arrTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name];
                                        } else { stPayCode = ""; }
                                    } else {
                                        if(typeof objPayCodes[arrTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name] != 'undefined') {
                                            stPayCode = objPayCodes[arrTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name];
                                        } else { stPayCode = arrTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name; }
                                    }
                                } else { stPayCode = "Other Unpaid Leave"; }


                                record.submitFields({
                                    type: "customrecord_sr_pc_time_off_assoc",
                                    id: arrTimeOffRequestsAssociation[intIndex].recordid,
                                    values: {
                                        custrecord_sr_pc_time_off_header: objData.intPayCycle,
                                        custrecord_timeofftype_paycode: stPayCode
                                    }
                                });
                            }
                        }

                        /** CANCELLED TIME-OFF REQUESTS **/
                        var arrReversalTimeOffRequestsAssociation = libHelper.getForReversalTimeOffRequestsAssociation(recPayrollProvider.getValue('custrecord_timeoff_types'), arrEmployeeListPayroll);
                        if(arrReversalTimeOffRequestsAssociation.length != 0) {
                            for(var intIndex in arrReversalTimeOffRequestsAssociation) {
                                if(libHelper.existInArrTimeOffTypes(arrTimeOffTypes, arrReversalTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name)) {
                                    if(payrollprovider == 1) {
                                        if(typeof objPayCodes[arrReversalTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name] != 'undefined') {
                                            stPayCode = objPayCodes[arrReversalTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name];
                                        } else { stPayCode = ""; }
                                    } else {
                                        if(typeof objPayCodes[arrReversalTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name] != 'undefined') {
                                            stPayCode = objPayCodes[arrReversalTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name];
                                        } else { stPayCode = arrReversalTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name; }
                                    }
                                } else { stPayCode = "Other Unpaid Leave"; }


                                record.submitFields({
                                    type: "customrecord_sr_pc_time_off_assoc",
                                    id: arrReversalTimeOffRequestsAssociation[intIndex].recordid,
                                    values: {
                                        custrecord_sr_pc_time_off_header: objData.intPayCycle,
                                        custrecord_timeofftype_paycode: stPayCode
                                    }
                                });
                            }
                        }

                    }

                } catch (e) {
                    log.debug('execute',e);
                }
            }

            return {
                execute: execute
            };

        });
