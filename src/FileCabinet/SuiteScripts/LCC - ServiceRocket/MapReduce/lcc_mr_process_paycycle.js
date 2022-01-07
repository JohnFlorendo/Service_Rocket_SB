/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search','../Library/lcc_lib_payroll'],
    /**
     * @param{record} record
     * @param{runtime} runtime
     * @param{search} search
     */
    function(record, runtime, search,libHelper) {
        var currentScript = runtime.getCurrentScript();
        function getInputData() {
            var returnObj = {};
            var stData = currentScript.getParameter({ name: 'custscript_param_data' });
            if(stData != "") {
                var objData = JSON.parse(stData);
                var arrEmployees = [];
                var recPayCycle = record.load({type: "customrecord_sr_pay_cycle", id: objData.intPayCycle, isDynamic: true });
                var objTimeOffTypes = libHelper.getTimeOffTypes();
                var payrollprovider = recPayCycle.getValue('custrecord_payroll_provider');
                var objCurrencies = libHelper.getCurrencies();
                var objPayCodes = {};
                var objCostCenterOverride = {};
                var objAllowancesOverride = {};
                var arrEmployeeListPayroll = [];

                var objEmployeePayroll = libHelper.getAllEmployeesPayroll(objData.startdate, objData.enddate, payrollprovider);
                var objEmployeeData = libHelper.getPayrollData(objEmployeePayroll, payrollprovider, objData.startdate, objData.enddate);

                /** APPEND EMPLOYEE DATA **/
                if(objData.arrEmployees != "") {
                    var arrEmployeeData = JSON.parse(objData.arrEmployees);
                    for(var intIndex=0; intIndex<arrEmployeeData.length; intIndex++) {
                        arrEmployeeListPayroll.push(arrEmployeeData[intIndex].employeeid);
                        arrEmployees.push(arrEmployeeData[intIndex].employeeid);
                    }
                }

            }

            if(objData.recordtype == "allowance") {
                var arrData = [];
                var recPayCycle = record.load({type: "customrecord_sr_pay_cycle", id: objData.intPayCycle, isDynamic: true });
                var payrollprovider = recPayCycle.getValue('custrecord_payroll_provider');
                var recPayrollProvider = record.load({type: "customrecord_payroll_provider", id: payrollprovider, isDynamic: true });
                if(recPayrollProvider.getValue('custrecord_sr_cost_center_override') != '') { objCostCenterOverride = JSON.parse(recPayrollProvider.getValue('custrecord_sr_cost_center_override')); }
                if(recPayrollProvider.getValue('custrecord_sr_pp_paycode_id') != '') { objPayCodes = JSON.parse(recPayrollProvider.getValue('custrecord_sr_pp_paycode_id')); }
                if(recPayrollProvider.getValue('custrecord_sr_allowance_override') != '') { objAllowancesOverride = JSON.parse(recPayrollProvider.getValue('custrecord_sr_allowance_override')); }
                var arrAllowances = libHelper.getEmployeeAllowances(arrEmployees, objData.startdate, objData.enddate);
                /** CREATE PAY CYCLE LINE AND PAY CYCLE ALLOWANCE PAYMENT **/
                if(arrAllowances.length != 0) {
                    for(var intIndex in arrAllowances) {
                        var flUSDRate = libHelper.getUSDCurrencyRate('allowance', arrAllowances[intIndex].allowancecurrency, objCurrencies, recPayCycle.getText('custrecord_sr_pc_start_date'), recPayCycle.getText('custrecord_sr_pc_end_date'));
                        var now = new Date();
                        var stCode = (typeof objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0] == 'undefined') ? "" : objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0].code;
                        var stCostCenter = (typeof objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0] == 'undefined') ? "" : objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0].cost_center;
                        // var stPayCode = (typeof objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0] == 'undefined') ? "" : objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0].paycode_id;
                        var stPayCode = (objAllowancesOverride[arrAllowances[intIndex].allowancetypetext] == null) ? arrAllowances[intIndex].allowancetypetext : objAllowancesOverride[arrAllowances[intIndex].allowancetypetext];
                        var dtStartDate = (typeof objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0] == 'undefined') ? "" : objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0].payroll_start;
                        var dtEndDate = (typeof objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0] == 'undefined') ? "" : objEmployeeData[arrAllowances[intIndex].allowanceemployee].data[0].payroll_end;

                        arrData.push({
                            recordtype:"allowance",
                            custrecord_sr_pcl_paycycleheader: recPayCycle.id,
                            custrecord_sr_pcl_employee_id: arrAllowances[intIndex].allowanceemployee,
                            custrecord_sr_pcl_employee_code: stCode,
                            custrecord_sr_pcl_cost_center_code: stCostCenter,
                            custrecord_sr_pcl_paycode_id: stPayCode,
                            custrecord_sr_pcl_quantity: arrAllowances[intIndex].allowanceamount,
                            custrecord_sr_pcl_payroll_start: dtStartDate,
                            custrecord_sr_pcl_end: dtEndDate,
                            custrecord_sr_pcl_allowance: arrAllowances[intIndex].allowanceid,
                            custrecord_sr_pcl_usd_amount: parseFloat(flUSDRate * arrAllowances[intIndex].allowanceamount),
                        });

                    }
                }
                return arrData;
            } else {
                return [{
                    "arrEmployees":objData.arrEmployees,
                    "startdate":objData.startdate,
                    "enddate":objData.enddate,
                    "intPayCycleId": objData.intPayCycle,
                    "recordtype": objData.recordtype,
                    "objEmployeeData": JSON.stringify(objEmployeeData)
                }];
            }
        }

        function map(context) {
            try {
                var objValue = JSON.parse(context.value);

                if(objValue.recordtype == "allowance") {
                    /** CREATE PAY CYCLE LINE AND PAY CYCLE ALLOWANCE PAYMENT **/
                    var recPayCycleLine = record.create({ type: "customrecord_sr_pay_cycle_lines", isDynamic: true });
                    recPayCycleLine.setValue('custrecord_sr_pcl_paycycleheader', objValue.custrecord_sr_pcl_paycycleheader);
                    recPayCycleLine.setValue('custrecord_sr_pcl_employee_id', objValue.custrecord_sr_pcl_employee_id);
                    recPayCycleLine.setValue('custrecord_sr_pcl_employee_code', objValue.custrecord_sr_pcl_employee_code);
                    recPayCycleLine.setValue('custrecord_sr_pcl_cost_center_code', objValue.custrecord_sr_pcl_cost_center_code);
                    recPayCycleLine.setValue('custrecord_sr_pcl_paycode_id', objValue.custrecord_sr_pcl_paycode_id);
                    recPayCycleLine.setValue('custrecord_sr_pcl_quantity', objValue.custrecord_sr_pcl_quantity);
                    recPayCycleLine.setValue('custrecord_sr_pcl_payroll_start', objValue.custrecord_sr_pcl_payroll_start);
                    recPayCycleLine.setValue('custrecord_sr_pcl_end', objValue.custrecord_sr_pcl_end);
                    recPayCycleLine.setValue('custrecord_leave_start', '');
                    recPayCycleLine.setValue('custrecord_leave_end', '');
                    recPayCycleLine.setValue('custrecord_number_pays', '1.00');
                    recPayCycleLine.setValue('custrecord_alternative_rate', 0);
                    recPayCycleLine.setValue('custrecord_sr_pcl_allowance', objValue.custrecord_sr_pcl_allowance);
                    recPayCycleLine.setValue('custrecord_sr_pcl_usd_amount', objValue.custrecord_sr_pcl_usd_amount);
                    var intPayCycleLineId = recPayCycleLine.save();

                    objValue["custrecord_sr_pay_cycle_header"]=objValue.custrecord_sr_pcl_paycycleheader;
                    objValue["custrecord_sr_pay_cycle_line_header"]=intPayCycleLineId;
                    objValue["custrecord_sr_allowance_amount_paid"]=objValue.custrecord_sr_pcl_quantity;
                    context.write({ key: intPayCycleLineId, value: objValue });
                } else {
                    var US_Netsuite_Payroll_Provider = 9;
                    var Malaysia_Payroll_Provider = 5;
                    var objEmployeeData = JSON.parse(objValue.objEmployeeData);
                    var recPayCycle = record.load({type: "customrecord_sr_pay_cycle", id: objValue.intPayCycleId, isDynamic: true });
                    var objTimeOffTypes = libHelper.getTimeOffTypes();
                    var payrollprovider = recPayCycle.getValue('custrecord_payroll_provider');
                    var recPayrollProvider = record.load({type: "customrecord_payroll_provider", id: payrollprovider, isDynamic: true });
                    var arrTimeOffTypes = recPayrollProvider.getText('custrecord_timeoff_types');
                    var objCurrencies = libHelper.getCurrencies();
                    var objPayCodes = {};
                    var objCostCenterOverride = {};
                    var objAllowancesOverride = {};
                    var arrEmployeeListPayroll = [];
                    var arrEmployees = [];


                    if(recPayrollProvider.getValue('custrecord_sr_cost_center_override') != '') { objCostCenterOverride = JSON.parse(recPayrollProvider.getValue('custrecord_sr_cost_center_override')); }
                    if(recPayrollProvider.getValue('custrecord_sr_pp_paycode_id') != '') { objPayCodes = JSON.parse(recPayrollProvider.getValue('custrecord_sr_pp_paycode_id')); }
                    if(recPayrollProvider.getValue('custrecord_sr_allowance_override') != '') { objAllowancesOverride = JSON.parse(recPayrollProvider.getValue('custrecord_sr_allowance_override')); }

                    /** APPEND EMPLOYEE DATA **/
                    if(objValue.arrEmployees != "") {
                        var arrEmployeeData = JSON.parse(objValue.arrEmployees);
                        for(var intIndex=0; intIndex<arrEmployeeData.length; intIndex++) {
                            arrEmployeeListPayroll.push(arrEmployeeData[intIndex].employeeid);
                            arrEmployees.push(arrEmployeeData[intIndex].employeeid);
                        }
                    }
                    var arrBonuses = libHelper.getEmployeeBonuses(arrEmployees, objValue.startdate,objValue.enddate);

                    /** ADD BONUSES IN THE PAY CYCLE LINE **/
                    if(arrBonuses.length != 0) {
                        var objBonuses = {};
                        var intBonusPaycodeId = '10524';

                        for(var intIndex in arrBonuses) {
                            /** ADD THE BONUS IN THE OBJECT IF BONUS STATUS IS READY TO PAY **/
                            if(arrBonuses[intIndex].bonusstatus == 'ready_to_pay') {
                                var flUSDRate = libHelper.getUSDCurrencyRate('bonus',arrBonuses[intIndex].bonuscurrency, objCurrencies, recPayCycle.getText('custrecord_sr_pc_start_date'), recPayCycle.getText('custrecord_sr_pc_end_date'));
                                if(payrollprovider != 1) { intBonusPaycodeId = arrBonuses[intIndex].bonustype; }
                                var intEmpId = arrBonuses[intIndex].bonusemployee;
                                var stCode = (typeof objEmployeeData[intEmpId].data[0] == 'undefined') ? "" : objEmployeeData[intEmpId].data[0].code;
                                var stCostCenter = (typeof objEmployeeData[intEmpId].data[0] == 'undefined') ? "" : objEmployeeData[intEmpId].data[0].cost_center;
                                var dtStartDate = (typeof objEmployeeData[intEmpId].data[0] == 'undefined') ? "" : objEmployeeData[intEmpId].data[0].payroll_start;
                                var dtEndDate = (typeof objEmployeeData[intEmpId].data[0] == 'undefined') ? "" : objEmployeeData[intEmpId].data[0].payroll_end;

                                if(objBonuses[intEmpId] == null) { objBonuses[intEmpId] = { data: [] }; }
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
                                var recBonusAssociation = record.create({ type: "customrecord_sr_pc_bonus_association", isDynamic: true });
                                recBonusAssociation.setValue('custrecord_sr_pc_bonus_id', arrBonuses[intIndex].bonusid);
                                recBonusAssociation.setValue('custrecord_sr_pc_pay_cycle', objValue.intPayCycleId);
                                recBonusAssociation.save();
                            }
                        }

                        for(var intIndex in objBonuses) {
                            for(var intIndexData in objBonuses[intIndex].data) {
                                var currentLine = recPayCycle.selectNewLine({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader' });
                                currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_employee_id', value: intIndex });
                                currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_employee_code', value: objBonuses[intIndex].data[intIndexData].code });
                                currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_cost_center_code', value: objBonuses[intIndex].data[intIndexData].cost_center });
                                currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_paycode_id', value: objBonuses[intIndex].data[intIndexData].paycode_id });
                                currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_quantity', value: parseFloat(objBonuses[intIndex].data[intIndexData].total_working_hours).toFixed(2) });
                                currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_payroll_start', value: objBonuses[intIndex].data[intIndexData].payroll_start });
                                currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_end', value: objBonuses[intIndex].data[intIndexData].payroll_end });
                                currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_leave_start', value: objBonuses[intIndex].data[intIndexData].leave_start });
                                currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_leave_end', value: objBonuses[intIndex].data[intIndexData].leave_end });
                                currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_number_pays', value: objBonuses[intIndex].data[intIndexData].number_pays });
                                currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_alternative_rate', value: objBonuses[intIndex].data[intIndexData].alter_rate });

                                if(typeof objBonuses[intIndex].data[intIndexData].bonusid != 'undefined') {
                                    currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_bonus', value: objBonuses[intIndex].data[intIndexData].bonusid });
                                }

                                if(typeof objBonuses[intIndex].data[intIndexData].bonustype != 'undefined') {
                                    currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_bonus_type', value: objBonuses[intIndex].data[intIndexData].bonustype });
                                }

                                if(typeof objBonuses[intIndex].data[intIndexData].usd_amount != 'undefined') {
                                    currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_usd_amount', value: objBonuses[intIndex].data[intIndexData].usd_amount });
                                }


                                if(typeof objBonuses[intIndex].data[intIndexData].isparent_row != 'undefined') {
                                    currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pc_is_parent_row', value: objBonuses[intIndex].data[intIndexData].isparent_row });
                                }

                                var currentLineObj = currentLine.commitLine({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader' });
                            }
                        }
                    }

                    if(recPayCycle.getValue('custrecord_payroll_provider') != US_Netsuite_Payroll_Provider) {
                        if(recPayCycle.getValue('custrecord_payroll_provider') == Malaysia_Payroll_Provider) {
                            var arrExpenseReports = libHelper.getEmployeeExpenseReportDetails(arrEmployees, objValue.startdate,objValue.enddate);
                        } else {
                            var arrExpenseReports = libHelper.getEmployeeExpenseReports(arrEmployees, objValue.startdate,objValue.enddate);
                        }


                        /** ADD EXPENSES REPORT IN THE PAY CYCLE LINE **/
                        if(arrExpenseReports.length != 0)  {
                            var objExpenseReports = {};
                            var intExpenseReportPaycodeId = '267507';
                            for(var intIndex in arrExpenseReports) {
                                if(arrExpenseReports[intIndex].status != "paidInFull") {
                                    if(payrollprovider != 1) { intExpenseReportPaycodeId = "Expense Reimbursement"; }
                                    var intEmpId = arrExpenseReports[intIndex].entityid;
                                    var stCode = (typeof objEmployeeData[intEmpId].data[0] == 'undefined') ? "" : objEmployeeData[intEmpId].data[0].code;
                                    var stCostCenter = (typeof objEmployeeData[intEmpId].data[0] == 'undefined') ? "" : objEmployeeData[intEmpId].data[0].cost_center;
                                    var dtStartDate = (typeof objEmployeeData[intEmpId].data[0] == 'undefined') ? "" : objEmployeeData[intEmpId].data[0].payroll_start;
                                    var dtEndDate = (typeof objEmployeeData[intEmpId].data[0] == 'undefined') ? "" : objEmployeeData[intEmpId].data[0].payroll_end;
                                    if(objExpenseReports[intEmpId] == null) { objExpenseReports[intEmpId] = { data:[] }; }
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

                                    if(recPayCycle.getValue('custrecord_payroll_provider') == Malaysia_Payroll_Provider) {
                                        temp["expensecategory"] = arrExpenseReports[intIndex].expensecategoryname
                                    }

                                    objExpenseReports[intEmpId].data.push(temp);

                                    /** LINK PAY CYCLE TO EXPENSE REPORTS **/
                                    record.submitFields({
                                        type: "expensereport",
                                        id: arrExpenseReports[intIndex].recordid,
                                        values: { custbody_sr_pay_cycle: objValue.intPayCycleId }
                                    });
                                }
                            }

                            for(var intIndex in objExpenseReports) {
                                for(var intIndexData in objExpenseReports[intIndex].data) {
                                    var currentLine = recPayCycle.selectNewLine({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader' });
                                    currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_employee_id', value: intIndex });
                                    currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_employee_code', value: objExpenseReports[intIndex].data[intIndexData].code });
                                    currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_cost_center_code', value: objExpenseReports[intIndex].data[intIndexData].cost_center });
                                    currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_paycode_id', value: objExpenseReports[intIndex].data[intIndexData].paycode_id });
                                    currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_quantity', value: parseFloat(objExpenseReports[intIndex].data[intIndexData].total_working_hours).toFixed(2) });
                                    currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_payroll_start', value: objExpenseReports[intIndex].data[intIndexData].payroll_start });
                                    currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_end', value: objExpenseReports[intIndex].data[intIndexData].payroll_end });
                                    currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_leave_start', value: objExpenseReports[intIndex].data[intIndexData].leave_start });
                                    currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_leave_end', value: objExpenseReports[intIndex].data[intIndexData].leave_end });
                                    currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_number_pays', value: objExpenseReports[intIndex].data[intIndexData].number_pays });
                                    currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_alternative_rate', value: objExpenseReports[intIndex].data[intIndexData].alter_rate });

                                    if(typeof objExpenseReports[intIndex].data[intIndexData].usd_amount != 'undefined') {
                                        currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_usd_amount', value: objExpenseReports[intIndex].data[intIndexData].usd_amount });
                                    }

                                    if(typeof objExpenseReports[intIndex].data[intIndexData].expensereportid != 'undefined') {
                                        currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_expense_report', value: objExpenseReports[intIndex].data[intIndexData].expensereportid });
                                    }

                                    if(typeof objExpenseReports[intIndex].data[intIndexData].expensecategory != 'undefined') {
                                        currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_expense_category', value: objExpenseReports[intIndex].data[intIndexData].expensecategory });
                                    }

                                    if(typeof objExpenseReports[intIndex].data[intIndexData].timeoffrequestassociationid != 'undefined') {
                                        currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_timeoff_association', value: objExpenseReports[intIndex].data[intIndexData].timeoffrequestassociationid });
                                    }

                                    if(typeof objExpenseReports[intIndex].data[intIndexData].isparent_row != 'undefined') {
                                        currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pc_is_parent_row', value: objExpenseReports[intIndex].data[intIndexData].isparent_row });
                                    }

                                    var currentLineObj = currentLine.commitLine({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader' });
                                }
                            }
                        }
                    }

                    /** APPEND EMPLOYEE DATA **/
                    if(objValue.arrEmployees != "") {
                        var arrEmployeeData = JSON.parse(objValue.arrEmployees);
                        for(var intIndex=0; intIndex<arrEmployeeData.length; intIndex++) {
                            var currentLine = recPayCycle.selectNewLine({ sublistId: 'recmachcustrecord_sr_pc_pay_cycle_header' });
                            currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pc_pay_cycle_header', fieldId: 'custrecord_sr_pc_emp_employee', value: arrEmployeeData[intIndex].employeeid });
                            currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pc_pay_cycle_header', fieldId: 'custrecord_sr_pc_cost_center', value: arrEmployeeData[intIndex].costcenter });
                            currentLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pc_pay_cycle_header', fieldId: 'custrecord_sr_pc_pay_cycle_header', value: objValue.intPayCycleId });
                            currentLine.commitLine({ sublistId: 'recmachcustrecord_sr_pc_pay_cycle_header' });
                        }
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

                    recPayCycle.save();
                    context.write({ key: objValue.intPayCycleId, value: objValue });
                }

            } catch(e) { log.debug("ERROR::MAP",e); }
        }

        function reduce(context) {
            try {
                var objValue = JSON.parse(context.values[0]);
                if(objValue.recordtype == "allowance") {
                    /** PAY CYCLE ALLOWANCE PAYMENT **/
                    var now = new Date();
                    var recPayCycleAllowancePayment = record.create({ type: "customrecord_sr_pc_allowance_payment", isDynamic: true });
                    recPayCycleAllowancePayment.setValue('custrecord_sr_pay_cycle_header', objValue.custrecord_sr_pay_cycle_header);
                    recPayCycleAllowancePayment.setValue('custrecord_sr_pay_cycle_line_header', objValue.custrecord_sr_pay_cycle_line_header);
                    recPayCycleAllowancePayment.setValue('custrecord_sr_allowance_amount_paid', objValue.custrecord_sr_allowance_amount_paid);
                    recPayCycleAllowancePayment.setValue('custrecord_sr_allowance_date_paid', now);
                    recPayCycleAllowancePayment.save();

                } else {
                    var objEmployeeData = JSON.parse(objValue.objEmployeeData);
                    var recPayCycle = record.load({type: "customrecord_sr_pay_cycle", id: objValue.intPayCycleId, isDynamic: true });
                    var objTimeOffTypes = libHelper.getTimeOffTypes();
                    var payrollprovider = recPayCycle.getValue('custrecord_payroll_provider');
                    var recPayrollProvider = record.load({type: "customrecord_payroll_provider", id: payrollprovider, isDynamic: true });
                    var arrTimeOffTypes = recPayrollProvider.getText('custrecord_timeoff_types');
                    var objCurrencies = libHelper.getCurrencies();
                    var objPayCodes = {};
                    var objCostCenterOverride = {};
                    var objAllowancesOverride = {};
                    var arrEmployeeListPayroll = [];
                    var arrEmployees = [];

                    if(recPayrollProvider.getValue('custrecord_sr_cost_center_override') != '') { objCostCenterOverride = JSON.parse(recPayrollProvider.getValue('custrecord_sr_cost_center_override')); }
                    if(recPayrollProvider.getValue('custrecord_sr_pp_paycode_id') != '') { objPayCodes = JSON.parse(recPayrollProvider.getValue('custrecord_sr_pp_paycode_id')); }
                    if(recPayrollProvider.getValue('custrecord_sr_allowance_override') != '') { objAllowancesOverride = JSON.parse(recPayrollProvider.getValue('custrecord_sr_allowance_override')); }

                    /** APPEND EMPLOYEE DATA **/
                    if(objValue.arrEmployees != "") {
                        var arrEmployeeData = JSON.parse(objValue.arrEmployees);
                        for(var intIndex=0; intIndex<arrEmployeeData.length; intIndex++) {
                            arrEmployeeListPayroll.push(arrEmployeeData[intIndex].employeeid);
                            arrEmployees.push(arrEmployeeData[intIndex].employeeid);
                        }
                    }

                    /** APPEND TIME-OFF REQUESTS **/
                    var arrTimeOffRequestsAssociation = libHelper.getTimeOffRequestsAssociationLists(recPayrollProvider.getValue('custrecord_timeoff_types'), arrEmployeeListPayroll, objValue.startdate,objValue.enddate);
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
                                    custrecord_sr_pc_time_off_header: objValue.intPayCycleId,
                                    custrecord_timeofftype_paycode: stPayCode
                                }
                            });
                        }
                    }

                    log.debug('arrTimeOffRequestsAssociation', arrTimeOffRequestsAssociation);

                    /** CANCELLED TIME-OFF REQUESTS **/
                    var arrReversalTimeOffRequestsAssociation = libHelper.getForReversalTimeOffRequestsAssociation(recPayrollProvider.getValue('custrecord_timeoff_types'), arrEmployeeListPayroll);
                    log.debug('arrReversalTimeOffRequestsAssociation', arrReversalTimeOffRequestsAssociation);
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
                                    custrecord_sr_pc_time_off_header: objValue.intPayCycleId,
                                    custrecord_timeofftype_paycode: stPayCode
                                }
                            });
                        }
                    }
                }

            } catch(e) { log.debug("ERROR::REDUCE",e); }
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce
        };

    });
