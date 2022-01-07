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
        var US_Netsuite_Payroll_Provider = 9;
        var Malaysia_Payroll_Provider = 5;

        function getInputData() {
            var stData = currentScript.getParameter({name: 'custscript_param_data_v2'});
            var arrEmployees = [];

            if(stData != "") {
                var objData = JSON.parse(stData);
                var recPayCycle = record.load({
                    type: "customrecord_sr_pay_cycle",
                    id: objData.intPayCycle,
                    isDynamic: true
                });
                var objTimeOffTypes = libHelper.getTimeOffTypes();
                var payrollprovider = recPayCycle.getValue('custrecord_payroll_provider');
                var recPayrollProvider = record.load({
                    type: "customrecord_payroll_provider",
                    id: payrollprovider,
                    isDynamic: true
                });
                var objCurrencies = libHelper.getCurrencies();
                var objPayCodes = {};
                var objCostCenterOverride = {};
                var objAllowancesOverride = {};
                var arrEmployeeListPayroll = [];

                if (recPayrollProvider.getValue('custrecord_sr_cost_center_override') != '') {
                    objCostCenterOverride = JSON.parse(recPayrollProvider.getValue('custrecord_sr_cost_center_override'));
                }
                if (recPayrollProvider.getValue('custrecord_sr_pp_paycode_id') != '') {
                    objPayCodes = JSON.parse(recPayrollProvider.getValue('custrecord_sr_pp_paycode_id'));
                }
                if (recPayrollProvider.getValue('custrecord_sr_allowance_override') != '') {
                    objAllowancesOverride = JSON.parse(recPayrollProvider.getValue('custrecord_sr_allowance_override'));
                }

                // var objEmployeePayroll = libHelper.getAllEmployeesPayroll(objData.startdate, objData.enddate, payrollprovider);
                // var objEmployeeData = libHelper.getPayrollData(objEmployeePayroll, payrollprovider, objData.startdate, objData.enddate);

                /** APPEND EMPLOYEE DATA **/
                if (objData.arrEmployees != "") {
                    var arrEmployeeData = JSON.parse(objData.arrEmployees);
                    for (var intIndex = 0; intIndex < arrEmployeeData.length; intIndex++) {
                        arrEmployees.push({
                            employeeid: arrEmployeeData[intIndex].employeeid,
                            paycycle_startdate: recPayCycle.getText('custrecord_sr_pc_start_date'),
                            paycycle_enddate: recPayCycle.getText('custrecord_sr_pc_end_date'),
                            paycycle_id: objData.intPayCycle,
                            recordtype: objData.recordtype,
                            payrollprovider: payrollprovider,
                            costcenter: arrEmployeeData[intIndex].costcenter,
                            objCostCenterOverride: objCostCenterOverride,
                            objPayCodes: objPayCodes,
                            objAllowancesOverride: objAllowancesOverride,
                            arrTimeOffTypesTexts: recPayrollProvider.getText('custrecord_timeoff_types'),
                            arrTimeOffTypesValues: recPayrollProvider.getValue('custrecord_timeoff_types'),
                            objCurrencies: objCurrencies,
                        });
                    }
                }
            }

            return arrEmployees;
        }

        function map(context) {
            var objValue = JSON.parse(context.value);
            var objEmployeePayroll = libHelper.getEmployeePayroll(objValue.employeeid, objValue.paycycle_startdate, objValue.paycycle_enddate, objValue.payrollprovider);
            var objEmployeeData = libHelper.getPayrollData(objEmployeePayroll, objValue.payrollprovider, objValue.paycycle_startdate, objValue.paycycle_enddate);

            switch(objValue.recordtype) {
                case "paycycle":
                    if (objValue.employeeid) {
                        var recEmployee = record.create({type: "customrecord_sr_pay_cycle_employee", isDynamic: true});
                        recEmployee.setValue('custrecord_sr_pc_emp_employee', objValue.employeeid);
                        recEmployee.setValue('custrecord_sr_pc_cost_center', objValue.costcenter);
                        recEmployee.setValue('custrecord_sr_pc_pay_cycle_header', objValue.paycycle_id);
                        recEmployee.save();
                    }

                    addPayCycleLine(objValue, objEmployeeData)
                    addTimeOffRequests(objValue);
                    break;
                case "bonus":
                    addBonuses(objValue, objEmployeeData);
                    break;
                case "allowance":
                    addAllowances(objValue, objEmployeeData);
                    break;
                case "expensereport":
                    addExpenseReports(objValue, objEmployeeData);
                    break;
            }

        }

        function reduce(context) {
            try {
                var objValue = JSON.parse(context.values[0]);
                log.debug("objValue", objValue);

            } catch (e) {
                log.debug("ERROR::REDUCE", e);
            }
        }

        function summarize(summary) {
            summary.mapSummary.errors.iterator().each(function (key, error) {
                log.error('Map Error for key: ' + key, error);
                return true;
            });
        }

        function addPayCycleLine(objValue, objEmployeeData) {
            for (var intIndex in objEmployeeData) {
                for (var intIndexData in objEmployeeData[intIndex].data) {
                    var recPayCycleLine = record.create({type: "customrecord_sr_pay_cycle_lines", isDynamic: true});
                    recPayCycleLine.setValue('custrecord_sr_pcl_paycycleheader', objValue.paycycle_id);
                    recPayCycleLine.setValue('custrecord_sr_pcl_employee_id', intIndex);
                    recPayCycleLine.setValue('custrecord_sr_pcl_employee_code', objEmployeeData[intIndex].data[intIndexData].code);
                    recPayCycleLine.setValue('custrecord_sr_pcl_cost_center_code', objEmployeeData[intIndex].data[intIndexData].cost_center);
                    recPayCycleLine.setValue('custrecord_sr_pcl_paycode_id', objEmployeeData[intIndex].data[intIndexData].paycode_id);
                    recPayCycleLine.setValue('custrecord_sr_pcl_quantity', parseFloat(objEmployeeData[intIndex].data[intIndexData].total_working_hours).toFixed(2));
                    recPayCycleLine.setValue('custrecord_sr_pcl_payroll_start', objEmployeeData[intIndex].data[intIndexData].payroll_start);
                    recPayCycleLine.setValue('custrecord_sr_pcl_end', objEmployeeData[intIndex].data[intIndexData].payroll_end);
                    recPayCycleLine.setValue('custrecord_leave_start', objEmployeeData[intIndex].data[intIndexData].leave_start);
                    recPayCycleLine.setValue('custrecord_leave_end', objEmployeeData[intIndex].data[intIndexData].leave_end);
                    recPayCycleLine.setValue('custrecord_number_pays', objEmployeeData[intIndex].data[intIndexData].number_pays);
                    recPayCycleLine.setValue('custrecord_alternative_rate', objEmployeeData[intIndex].data[intIndexData].alter_rate);

                    if (typeof objEmployeeData[intIndex].data[intIndexData].bonusid != 'undefined') {
                        recPayCycleLine.setValue('custrecord_sr_pcl_bonus', objEmployeeData[intIndex].data[intIndexData].bonusid);
                    }
                    if (typeof objEmployeeData[intIndex].data[intIndexData].bonustype != 'undefined') {
                        recPayCycleLine.setValue('custrecord_sr_pcl_bonus_type', objEmployeeData[intIndex].data[intIndexData].bonustype);
                    }
                    if (typeof objEmployeeData[intIndex].data[intIndexData].usd_amount != 'undefined') {
                        recPayCycleLine.setValue('custrecord_sr_pcl_usd_amount', objEmployeeData[intIndex].data[intIndexData].usd_amount);
                    }
                    if (typeof objEmployeeData[intIndex].data[intIndexData].expensereportid != 'undefined') {
                        recPayCycleLine.setValue('custrecord_sr_pcl_expense_report', objEmployeeData[intIndex].data[intIndexData].expensereportid);
                    }
                    if (typeof objEmployeeData[intIndex].data[intIndexData].commissionid != 'undefined') {
                        recPayCycleLine.setValue('custrecord_sr_pcl_commission', objEmployeeData[intIndex].data[intIndexData].commissionid);
                    }
                    if (typeof objEmployeeData[intIndex].data[intIndexData].timeoffrequestassociationid != 'undefined') {
                        recPayCycleLine.setValue('custrecord_sr_pcl_timeoff_association', objEmployeeData[intIndex].data[intIndexData].timeoffrequestassociationid);
                    }
                    if (typeof objEmployeeData[intIndex].data[intIndexData].isparent_row != 'undefined') {
                        recPayCycleLine.setValue('custrecord_sr_pc_is_parent_row', objEmployeeData[intIndex].data[intIndexData].isparent_row);
                    }
                    recPayCycleLine.save();
                }
            }
        }

        function addTimeOffRequests(objValue) {
            /** APPEND TIME-OFF REQUESTS **/
            var arrTimeOffRequestsAssociation = libHelper.getTimeOffRequestsAssociationLists(objValue.arrTimeOffTypesValues, [objValue.employeeid], objValue.paycycle_startdate, objValue.paycycle_enddate);
            if (arrTimeOffRequestsAssociation.length != 0) {
                for (var intIndex in arrTimeOffRequestsAssociation) {
                    if (libHelper.existInArrTimeOffTypes(objValue.arrTimeOffTypesTexts, arrTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name)) {
                        if (objValue.payrollprovider == 1) {
                            if (typeof objValue.objPayCodes[arrTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name] != 'undefined') {
                                stPayCode = objValue.objPayCodes[arrTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name];
                            } else {
                                stPayCode = "";
                            }
                        } else {
                            if (typeof objValue.objPayCodes[arrTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name] != 'undefined') {
                                stPayCode = objValue.objPayCodes[arrTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name];
                            } else {
                                stPayCode = arrTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name;
                            }
                        }
                    } else {
                        stPayCode = "Other Unpaid Leave";
                    }


                    record.submitFields({
                        type: "customrecord_sr_pc_time_off_assoc",
                        id: arrTimeOffRequestsAssociation[intIndex].recordid,
                        values: {
                            custrecord_sr_pc_time_off_header: objValue.paycycle_id,
                            custrecord_timeofftype_paycode: stPayCode
                        }
                    });
                }
            }

            /** CANCELLED TIME-OFF REQUESTS **/
            var arrReversalTimeOffRequestsAssociation = libHelper.getForReversalTimeOffRequestsAssociation(objValue.arrTimeOffTypesValues, [objValue.employeeid]);
            if (arrReversalTimeOffRequestsAssociation.length != 0) {
                for (var intIndex in arrReversalTimeOffRequestsAssociation) {
                    if (libHelper.existInArrTimeOffTypes(objValue.arrTimeOffTypesTexts, arrReversalTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name)) {
                        if (objValue.payrollprovider == 1) {
                            if (typeof objValue.objPayCodes[arrReversalTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name] != 'undefined') {
                                stPayCode = objValue.objPayCodes[arrReversalTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name];
                            } else {
                                stPayCode = "";
                            }
                        } else {
                            if (typeof objValue.objPayCodes[arrReversalTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name] != 'undefined') {
                                stPayCode = objValue.objPayCodes[arrReversalTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name];
                            } else {
                                stPayCode = arrReversalTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name;
                            }
                        }
                    } else {
                        stPayCode = "Other Unpaid Leave";
                    }


                    record.submitFields({
                        type: "customrecord_sr_pc_time_off_assoc",
                        id: arrReversalTimeOffRequestsAssociation[intIndex].recordid,
                        values: {
                            custrecord_sr_pc_time_off_header: objValue.paycycle_id,
                            custrecord_timeofftype_paycode: stPayCode
                        }
                    });
                }
            }
        }

        function addBonuses(objValue, objEmployeeData) {
            var arrBonuses = libHelper.getEmployeeBonuses([objValue.employeeid], objValue.paycycle_startdate.toString(), objValue.paycycle_enddate.toString());

            /** ADD BONUSES IN THE PAY CYCLE LINE **/
            if (arrBonuses.length != 0) {
                var objBonuses = {};
                var intBonusPaycodeId = '10524';

                for (var intIndex in arrBonuses) {
                    /** ADD THE BONUS IN THE OBJECT IF BONUS STATUS IS READY TO PAY **/
                    if (arrBonuses[intIndex].bonusstatus == 'ready_to_pay') {
                        var flUSDRate = libHelper.getUSDCurrencyRate('bonus', arrBonuses[intIndex].bonuscurrency, objValue.objCurrencies, objValue.paycycle_startdate.toString(), objValue.paycycle_enddate.toString());
                        if (objValue.payrollprovider != 1) {
                            intBonusPaycodeId = arrBonuses[intIndex].bonustype;
                        }
                        var intEmpId = arrBonuses[intIndex].bonusemployee;
                        var stCode = (typeof objEmployeeData[intEmpId].data[0] == 'undefined') ? "" : objEmployeeData[intEmpId].data[0].code;
                        var stCostCenter = (typeof objEmployeeData[intEmpId].data[0] == 'undefined') ? "" : objEmployeeData[intEmpId].data[0].cost_center;
                        var dtStartDate = (typeof objEmployeeData[intEmpId].data[0] == 'undefined') ? "" : objEmployeeData[intEmpId].data[0].payroll_start;
                        var dtEndDate = (typeof objEmployeeData[intEmpId].data[0] == 'undefined') ? "" : objEmployeeData[intEmpId].data[0].payroll_end;

                        if (objBonuses[intEmpId] == null) { objBonuses[intEmpId] = {data: []}; }

                        objBonuses[intEmpId].data.push({
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

                        /** CREATE BONUS ASSOCIATION **/
                        var recBonusAssociation = record.create({
                            type: "customrecord_sr_pc_bonus_association",
                            isDynamic: true
                        });
                        recBonusAssociation.setValue('custrecord_sr_pc_bonus_id', arrBonuses[intIndex].bonusid);
                        recBonusAssociation.setValue('custrecord_sr_pc_pay_cycle', objValue.paycycle_id);
                        recBonusAssociation.save();
                    }
                }

                for (var intIndex in objBonuses) {
                    for (var intIndexData in objBonuses[intIndex].data) {
                        var recPayCycleLine = record.create({type: "customrecord_sr_pay_cycle_lines", isDynamic: true});
                        recPayCycleLine.setValue('custrecord_sr_pcl_paycycleheader', objValue.paycycle_id);
                        recPayCycleLine.setValue('custrecord_sr_pcl_employee_id', intIndex);
                        recPayCycleLine.setValue('custrecord_sr_pcl_employee_code', objBonuses[intIndex].data[intIndexData].code);
                        recPayCycleLine.setValue('custrecord_sr_pcl_cost_center_code', objBonuses[intIndex].data[intIndexData].cost_center);
                        recPayCycleLine.setValue('custrecord_sr_pcl_paycode_id', objBonuses[intIndex].data[intIndexData].paycode_id);
                        recPayCycleLine.setValue('custrecord_sr_pcl_quantity', parseFloat(objBonuses[intIndex].data[intIndexData].total_working_hours).toFixed(2));
                        recPayCycleLine.setValue('custrecord_sr_pcl_payroll_start', objBonuses[intIndex].data[intIndexData].payroll_start);
                        recPayCycleLine.setValue('custrecord_sr_pcl_end', objBonuses[intIndex].data[intIndexData].payroll_end);
                        recPayCycleLine.setValue('custrecord_leave_start', objBonuses[intIndex].data[intIndexData].leave_start);
                        recPayCycleLine.setValue('custrecord_leave_end', objBonuses[intIndex].data[intIndexData].leave_end);
                        recPayCycleLine.setValue('custrecord_number_pays', objBonuses[intIndex].data[intIndexData].number_pays);
                        recPayCycleLine.setValue('custrecord_alternative_rate', objBonuses[intIndex].data[intIndexData].alter_rate);

                        if (typeof objBonuses[intIndex].data[intIndexData].bonusid != 'undefined') {
                            recPayCycleLine.setValue('custrecord_sr_pcl_bonus', objBonuses[intIndex].data[intIndexData].bonusid);
                        }
                        if (typeof objBonuses[intIndex].data[intIndexData].bonustype != 'undefined') {
                            recPayCycleLine.setValue('custrecord_sr_pcl_bonus_type', objBonuses[intIndex].data[intIndexData].bonustype);
                        }
                        if (typeof objBonuses[intIndex].data[intIndexData].usd_amount != 'undefined') {
                            recPayCycleLine.setValue('custrecord_sr_pcl_usd_amount', objBonuses[intIndex].data[intIndexData].usd_amount);
                        }
                        if (typeof objBonuses[intIndex].data[intIndexData].timeoffrequestassociationid != 'undefined') {
                            recPayCycleLine.setValue('custrecord_sr_pcl_timeoff_association', objBonuses[intIndex].data[intIndexData].timeoffrequestassociationid);
                        }

                        log.debug('paycycle line bonus', recPayCycleLine.save());
                    }
                }
            }
        }

        function addAllowances(objValue, objEmployeeData) {
            var arrAllowances = libHelper.getEmployeeAllowances([objValue.employeeid], objValue.paycycle_startdate, objValue.paycycle_enddate);

            /** CREATE PAY CYCLE LINE AND PAY CYCLE ALLOWANCE PAYMENT **/
            if (arrAllowances.length != 0) {
                for (var intIndex in arrAllowances) {
                    var flUSDRate = libHelper.getUSDCurrencyRate('allowance', arrAllowances[intIndex].allowancecurrency, objValue.objCurrencies, objValue.paycycle_startdate, objValue.paycycle_enddate);

                    var now = new Date();
                    var stCode = (typeof objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0] == 'undefined') ? "" : objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0].code;
                    var stCostCenter = (typeof objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0] == 'undefined') ? "" : objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0].cost_center;
                    // var stPayCode = (typeof objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0] == 'undefined') ? "" : objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0].paycode_id;
                    var stPayCode = (objValue.objAllowancesOverride[arrAllowances[intIndex].allowancetypetext] == null) ? arrAllowances[intIndex].allowancetypetext : objValue.objAllowancesOverride[arrAllowances[intIndex].allowancetypetext];
                    var dtStartDate = (typeof objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0] == 'undefined') ? "" : objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0].payroll_start;
                    var dtEndDate = (typeof objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0] == 'undefined') ? "" : objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0].payroll_end;

                    var recPayCycleLine = record.create({ type: "customrecord_sr_pay_cycle_lines", isDynamic: true });
                    recPayCycleLine.setValue('custrecord_sr_pcl_paycycleheader', objValue.paycycle_id);
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
                    recPayCycleAllowancePayment.setValue('custrecord_sr_pay_cycle_header', objValue.paycycle_id);
                    recPayCycleAllowancePayment.setValue('custrecord_sr_pay_cycle_line_header', intPayCycleLineId);
                    recPayCycleAllowancePayment.setValue('custrecord_sr_allowance_amount_paid', arrAllowances[intIndex].allowanceamount);
                    recPayCycleAllowancePayment.setValue('custrecord_sr_allowance_date_paid', now);
                    recPayCycleAllowancePayment.save();
                }
            }
        }

        function addExpenseReports(objValue, objEmployeeData) {
            if (objValue.payrollprovider != US_Netsuite_Payroll_Provider) {
                if (objValue.payrollprovider == Malaysia_Payroll_Provider) {
                    var arrExpenseReports = libHelper.getEmployeeExpenseReportDetails([objValue.employeeid], objValue.paycycle_startdate, objValue.paycycle_enddate);
                } else {
                    var arrExpenseReports = libHelper.getEmployeeExpenseReports([objValue.employeeid], objValue.paycycle_startdate, objValue.paycycle_enddate);
                }

                /** ADD EXPENSES REPORT IN THE PAY CYCLE LINE **/
                if (arrExpenseReports.length != 0) {
                    var objExpenseReports = {};
                    var intExpenseReportPaycodeId = '267507';
                    for (var intIndex in arrExpenseReports) {
                        if (arrExpenseReports[intIndex].status != "paidInFull") {
                            if (objValue.payrollprovider != 1) {
                                intExpenseReportPaycodeId = "Expense Reimbursement";
                            }
                            var intEmpId = arrExpenseReports[intIndex].entityid;
                            var stCode = (typeof objEmployeeData[intEmpId].data[0] == 'undefined') ? "" : objEmployeeData[intEmpId].data[0].code;
                            var stCostCenter = (typeof objEmployeeData[intEmpId].data[0] == 'undefined') ? "" : objEmployeeData[intEmpId].data[0].cost_center;
                            var dtStartDate = (typeof objEmployeeData[intEmpId].data[0] == 'undefined') ? "" : objEmployeeData[intEmpId].data[0].payroll_start;
                            var dtEndDate = (typeof objEmployeeData[intEmpId].data[0] == 'undefined') ? "" : objEmployeeData[intEmpId].data[0].payroll_end;
                            if (objExpenseReports[intEmpId] == null) {
                                objExpenseReports[intEmpId] = {data: []};
                            }
                            var temp = {
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
                            };

                            if (objValue.payrollprovider == Malaysia_Payroll_Provider) {
                                temp["expensecategory"] = arrExpenseReports[intIndex].expensecategoryname
                            }

                            objExpenseReports[intEmpId].data.push(temp);

                            /** LINK PAY CYCLE TO EXPENSE REPORTS **/
                            record.submitFields({
                                type: "expensereport",
                                id: arrExpenseReports[intIndex].recordid,
                                values: { custbody_sr_pay_cycle: objValue.paycycle_id }
                            });
                        }
                    }

                    for (var intIndex in objExpenseReports) {
                        for (var intIndexData in objExpenseReports[intIndex].data) {
                            var recPayCycleLine = record.create({ type: "customrecord_sr_pay_cycle_lines", isDynamic: true });
                            recPayCycleLine.setValue('custrecord_sr_pcl_paycycleheader', objValue.paycycle_id);
                            recPayCycleLine.setValue('custrecord_sr_pcl_employee_id', intIndex);
                            recPayCycleLine.setValue('custrecord_sr_pcl_employee_code', objExpenseReports[intIndex].data[intIndexData].code);
                            recPayCycleLine.setValue('custrecord_sr_pcl_cost_center_code', objExpenseReports[intIndex].data[intIndexData].cost_center);
                            recPayCycleLine.setValue('custrecord_sr_pcl_paycode_id', objExpenseReports[intIndex].data[intIndexData].paycode_id);
                            recPayCycleLine.setValue('custrecord_sr_pcl_quantity', parseFloat(objExpenseReports[intIndex].data[intIndexData].total_working_hours).toFixed(2));
                            recPayCycleLine.setValue('custrecord_sr_pcl_payroll_start', objExpenseReports[intIndex].data[intIndexData].payroll_start);
                            recPayCycleLine.setValue('custrecord_sr_pcl_end', objExpenseReports[intIndex].data[intIndexData].payroll_end);
                            recPayCycleLine.setValue('custrecord_leave_start', objExpenseReports[intIndex].data[intIndexData].leave_start);
                            recPayCycleLine.setValue('custrecord_leave_end', objExpenseReports[intIndex].data[intIndexData].leave_end);
                            recPayCycleLine.setValue('custrecord_number_pays', objExpenseReports[intIndex].data[intIndexData].number_pays);
                            recPayCycleLine.setValue('custrecord_alternative_rate', objExpenseReports[intIndex].data[intIndexData].alter_rate);

                            if (typeof objExpenseReports[intIndex].data[intIndexData].usd_amount != 'undefined') {
                                recPayCycleLine.setValue('custrecord_sr_pcl_usd_amount', objExpenseReports[intIndex].data[intIndexData].usd_amount);
                            }

                            if (typeof objExpenseReports[intIndex].data[intIndexData].expensereportid != 'undefined') {
                                recPayCycleLine.setValue('custrecord_sr_pcl_expense_report', objExpenseReports[intIndex].data[intIndexData].expensereportid);
                            }

                            if (typeof objExpenseReports[intIndex].data[intIndexData].expensecategory != 'undefined') {
                                recPayCycleLine.setValue('custrecord_sr_pcl_expense_category', objExpenseReports[intIndex].data[intIndexData].expensecategory);
                            }

                            if (typeof objExpenseReports[intIndex].data[intIndexData].timeoffrequestassociationid != 'undefined') {
                                recPayCycleLine.setValue('custrecord_sr_pcl_timeoff_association', objExpenseReports[intIndex].data[intIndexData].timeoffrequestassociationid);
                            }

                            var intPayCycleLineId = recPayCycleLine.save();
                        }
                    }
                }
            }
        }

        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
            // reduce: reduce,
        };

    });
