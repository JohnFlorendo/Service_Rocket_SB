/**
*@NApiVersion 2.x
*@NScriptType UserEventScript
*/
define(['N/format','N/task','N/search','N/record','N/url', 'N/ui/message', 'N/ui/serverWidget', '../Library/lcc_lib_payroll'],
function(format,task,search,record,url, message,serverWidget, libHelper) {

    function beforeLoad(context) {
        var newRecord = context.newRecord;
        var form = context.form;
        var request = context.request;
        var US_Netsuite_Payroll_Provider = 9;
        var Malaysia_Payroll_Provider = 5;
        var arrEmployees = [];

        if(typeof request != "undefined") {
            if(typeof request.parameters.custpage_objTasks != 'undefined') {
                generatePCStatusField(context);
            }
        }
        if(newRecord.getValue('custrecord_sr_pc_status') == 4) {
            generateVoidPCStatusField(context)
        }

        var objDeletedDataStorage = form.addField({
            id : 'custpage_deleteddatastorage',
            type : serverWidget.FieldType.TEXTAREA,
            label : 'Deleted Time-Off Associations'
        }).updateDisplayType({
            displayType : serverWidget.FieldDisplayType.HIDDEN
        });
        objDeletedDataStorage.defaultValue = "";

        form.addTab({ id : 'custpage_tabbonus', label : 'Bonus' });
        form.addTab({ id : 'custpage_taballowance', label : 'Allowance' });

        var sublistBonus = form.addSublist({
            id: 'custpage_sublist',
            type: serverWidget.SublistType.LIST,
            tab: 'custpage_tabbonus',
            label: 'Bonus'
        });
        sublistBonus.displayType = serverWidget.SublistDisplayType.NORMAL;

        var sublistAllowance = form.addSublist({
            id: 'custpage_sublistallowance',
            type: serverWidget.SublistType.INLINEEDITOR,
            tab: 'custpage_taballowance',
            label: 'Allowance'
        });
        sublistAllowance.displayType = serverWidget.SublistDisplayType.NORMAL;

        addColumnsToBonusSublist(form, sublistBonus);
        addColumnsToAllowanceSublist(form, sublistAllowance);

        if(newRecord.id != null) {
            var recPayCycle = record.load({type: "customrecord_sr_pay_cycle", id: newRecord.id, isDynamic: true });
            var recPayrollProvider = record.load({type: "customrecord_payroll_provider", id: recPayCycle.getValue('custrecord_payroll_provider'), isDynamic: true });

            for(var intIndex=0; intIndex<recPayCycle.getLineCount('recmachcustrecord_sr_pc_pay_cycle_header'); intIndex++) {
                arrEmployees.push(recPayCycle.getSublistValue({ sublistId: 'recmachcustrecord_sr_pc_pay_cycle_header', fieldId: 'custrecord_sr_pc_emp_employee', line: intIndex }));
            }

            if(recPayCycle.getValue('custrecord_payroll_provider') != US_Netsuite_Payroll_Provider) {
                /** EXPENSE REPORTS **/
                form.addTab({ id : 'custpage_tabexpensesreport', label : 'Expense Reimbursement' });
                var sublistExpensesReport = form.addSublist({
                    id: 'custpage_sublistexpensereport',
                    type: serverWidget.SublistType.INLINEEDITOR,
                    tab: 'custpage_tabexpensesreport',
                    label: 'Expense Reimbursement'
                });
                sublistExpensesReport.displayType = serverWidget.SublistDisplayType.NORMAL;
                if(recPayCycle.getValue('custrecord_payroll_provider') == Malaysia_Payroll_Provider) {
                    addColumnsToExpenseReportDetailsSublist(form, sublistExpensesReport);
                    populateExpenseReportDetailsSublist(recPayCycle, arrEmployees, sublistExpensesReport);
                } else {
                    addColumnsToExpenseReportSublist(form, sublistExpensesReport);
                    populateExpenseReportSublist(recPayCycle, arrEmployees, sublistExpensesReport);
                }

                /** COMMISSIONS **/
                // form.addTab({ id : 'custpage_tabcommission', label : 'Commissions' });
                // var sublistCommission = form.addSublist({
                //     id: 'custpage_sublistcommission',
                //     type: serverWidget.SublistType.INLINEEDITOR,
                //     tab: 'custpage_tabcommission',
                //     label: 'Commissions'
                // });
                // sublistCommission.displayType = serverWidget.SublistDisplayType.NORMAL;
                // addColumnsToCommissionSublist(form, sublistCommission);
                // populateCommissionSublist(recPayCycle, arrEmployees, sublistCommission);
            }



            populateBonusSublist(recPayCycle, arrEmployees, sublistBonus);
            populateAllowanceSublist(recPayCycle, arrEmployees, sublistAllowance);

            if(context.type == 'view') {
                /** GET TOTAL TIME-OFF REQUEST HOURS **/
                var flTotalHours = 0;
                for(var intIndex=0; intIndex<recPayCycle.getLineCount('recmachcustrecord_sr_pc_time_off_header'); intIndex++) {
                    flTotalHours += parseFloat(recPayCycle.getSublistValue({ sublistId: 'recmachcustrecord_sr_pc_time_off_header', fieldId: 'custrecord_sr_pc_amount_of_time', line: intIndex}));
                }

                /** APPEND OVER ALL TOTAL COUNTERS FOR TIME-OFF REQUESTS AND EMPLOYEE LISTS **/
                var stInline = '<script type="text/javascript">';
                stInline += "setTimeout(function(){ ";
                stInline += "if(document.getElementById('recmachcustrecord_sr_pc_time_off_header__tab') != null) { ";
                stInline += "    var tbodyRef = document.getElementById('recmachcustrecord_sr_pc_time_off_header__tab').getElementsByTagName('tbody')[0]; ";
                stInline += "    var newRow = tbodyRef.insertRow(); ";
                stInline += "    newRow.insertCell(); newRow.insertCell(); newRow.insertCell(); newRow.insertCell(); newRow.insertCell(); newRow.insertCell(); newRow.insertCell(); ";
                stInline += "    var newCell = newRow.insertCell(); ";
                stInline += "    var newText = document.createTextNode("+parseFloat(flTotalHours).toFixed(2)+"); ";
                stInline += "    newCell.setAttribute('style','text-align:right; font-size: 13px; font-weight: bold;'); ";
                stInline += "    newCell.appendChild(newText); ";
                stInline += "} ";

                stInline += "var div = document.createElement('div');";
                stInline += "div.setAttribute('style','display:inline; float:right; font-size:14px !important; font-weight:bold; color:#24385B !important;');";
                stInline += "div.innerHTML = 'Total No. of Time-off Requests: '+"+recPayCycle.getLineCount('recmachcustrecord_sr_pc_time_off_header')+";";
                stInline += "document.getElementById('tbl_attach').parentNode.appendChild(div);";
                stInline += "var div = document.createElement('td');";
                stInline += "div.setAttribute('style','display:inline; float:right; font-size:14px !important; font-weight:bold; color:#24385B !important;');";
                stInline += "div.innerHTML = 'Total No. of Employees: '+"+recPayCycle.getLineCount('recmachcustrecord_sr_pc_pay_cycle_header')+";";
                stInline += "document.getElementById('tbl_newrecrecmachcustrecord_sr_pc_pay_cycle_header').parentNode.parentNode.appendChild(div);";
                stInline += "}, 500);";
                stInline+='</script>';

                var fldInline = form.addField({
                    id : 'custpage_inlinehtml',
                    type : serverWidget.FieldType.INLINEHTML,
                    label : 'INLINE HTML'
                });

                fldInline.defaultValue = stInline;
            }
        }
    }

    function addColumnsToBonusSublist(form, sublist) {

        sublist.addField({
            id: 'custpage_bonusemployee',
            type: serverWidget.FieldType.SELECT,
            label: 'Employee',
            source:'employee'
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

        sublist.addField({
            id: 'custpage_bonusawarddate',
            type: serverWidget.FieldType.DATE,
            label: 'Award Date'
        });//.updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });

        sublist.addField({
            id: 'custpage_bonusamountpercentage',
            type: serverWidget.FieldType.FLOAT,
            label: 'Amount Percentage'
        });//.updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });

        sublist.addField({
            id: 'custpage_bonusamountabsolute',
            type: serverWidget.FieldType.CURRENCY,
            label: 'Amount'
        });//.updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });

        sublist.addField({
            id: 'custpage_bonustype',
            type: serverWidget.FieldType.TEXT,
            label: 'Bonus Type'
        });//.updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });

        sublist.addField({
            id: 'custpage_bonuscurrency',
            type: serverWidget.FieldType.TEXT,
            label: 'Currency'
        });//.updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });

        sublist.addField({
            id: 'custpage_bonusstatus',
            type: serverWidget.FieldType.TEXT,
            label: 'Bonus Status'
        });//.updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });

        sublist.addField({
            id: 'custpage_btn',
            type: serverWidget.FieldType.TEXTAREA,
            label: 'Action'
        });//.updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
    }

    function populateBonusSublist(newRecord, arrEmployees, sublist) {
        if(arrEmployees.length == 0) { return; }
        var count = 0;
        if(newRecord.getValue('custrecord_sr_pc_status') != 4) { // VOID
            // var arrBonuses = libHelper.getEmployeeBonuses(arrEmployees, newRecord.getText('custrecord_sr_pc_start_date'), newRecord.getText('custrecord_sr_pc_end_date'));
            var arrBonuses = libHelper.getEmployeeBonusDetailsByPayCycle(newRecord.id);

            for (var intIndex in arrBonuses) {
                var urlLink = libHelper.getURL('customscript_lcc_sl_work_calculations','customdeploy_lcc_sl_work_calculations');
                urlLink += '&custpage_action=updatebonus';
                urlLink += '&custpage_bonus_id='+arrBonuses[intIndex].bonusid;
                urlLink += '&custpage_paycyle_id='+newRecord.id;

                if(arrBonuses[intIndex].bonusstatus == 'none') {
                    urlLink += '&custpage_status=ready_to_pay';
                    sublist.setSublistValue({ id: "custpage_btn", line: count, value: "<a style='text-decoration: none;' href='"+urlLink+"'>Mark as Ready to Pay</a>"});
                } else if(arrBonuses[intIndex].bonusstatus == 'ready_to_pay') {
                    urlLink += '&custpage_status=paid';
                    sublist.setSublistValue({ id: "custpage_btn", line: count, value: "<a style='text-decoration: none;' href='"+urlLink+"'>Mark as Paid</a>"});
                }

                var stBonusAmountPercentage = (arrBonuses[intIndex].bonusamountpercentage == '') ? 0 : arrBonuses[intIndex].bonusamountpercentage;
                var stBonusAmountAbsolute = (arrBonuses[intIndex].bonusamountabsolute == '') ? 0 : arrBonuses[intIndex].bonusamountabsolute;
                sublist.setSublistValue({ id: "custpage_bonusemployee", line: count, value: arrBonuses[intIndex].bonusemployee });
                sublist.setSublistValue({ id: "custpage_bonusawarddate", line: count, value: arrBonuses[intIndex].bonusawarddate });
                sublist.setSublistValue({ id: "custpage_bonusamountpercentage", line: count, value: stBonusAmountPercentage });
                sublist.setSublistValue({ id: "custpage_bonusamountabsolute", line: count, value: stBonusAmountAbsolute });
                sublist.setSublistValue({ id: "custpage_bonustype", line: count, value: arrBonuses[intIndex].bonustype });
                sublist.setSublistValue({ id: "custpage_bonuscurrency", line: count, value: arrBonuses[intIndex].bonuscurrency });
                sublist.setSublistValue({ id: "custpage_bonusstatus", line: count, value: arrBonuses[intIndex].bonusstatus });
                count++;
            }
        }
    }

    function addColumnsToAllowanceSublist(form, sublist) {

        sublist.addField({
            id: 'custpage_allowanceemployee',
            type: serverWidget.FieldType.TEXT,
            label: 'Employee'
        }).updateDisplayType({ displayType : serverWidget.FieldDisplayType.DISABLED });

        sublist.addField({
            id: 'custpage_allowancetype',
            type: serverWidget.FieldType.TEXT,
            label: 'Allowance Type'
        }).updateDisplayType({ displayType : serverWidget.FieldDisplayType.DISABLED });

        sublist.addField({
            id: 'custpage_allowancestartdate',
            type: serverWidget.FieldType.TEXT,
            label: 'Start Date'
        }).updateDisplayType({ displayType : serverWidget.FieldDisplayType.DISABLED });

        sublist.addField({
            id: 'custpage_allowanceenddate',
            type: serverWidget.FieldType.TEXT,
            label: 'End Date'
        }).updateDisplayType({ displayType : serverWidget.FieldDisplayType.DISABLED });

        sublist.addField({
            id: 'custpage_allowanceamount',
            type: serverWidget.FieldType.CURRENCY,
            label: 'Amount'
        }).updateDisplayType({ displayType : serverWidget.FieldDisplayType.NORMAL });
    }

    function populateAllowanceSublist(recPayCycle, arrEmployees, sublistAllowance) {
        if(arrEmployees.length == 0) { return; }
        var count = 0;
        if(recPayCycle.getValue('custrecord_sr_pc_status') != 4) { // VOID
            var arrAllowances = libHelper.getEmployeeAllowances(arrEmployees, recPayCycle.getText('custrecord_sr_pc_start_date'), recPayCycle.getText('custrecord_sr_pc_end_date'));

            for (var intIndex in arrAllowances) {
                var stAllowanceType = (arrAllowances[intIndex].allowancetypetext == "") ? " " : arrAllowances[intIndex].allowancetypetext;
                var stAllowanceEndDate = (arrAllowances[intIndex].allowanceenddate == "") ? " " : arrAllowances[intIndex].allowanceenddate;
                sublistAllowance.setSublistValue({
                    id: "custpage_allowanceemployee",
                    line: count,
                    value: arrAllowances[intIndex].allowanceemployeetext
                });
                sublistAllowance.setSublistValue({
                    id: "custpage_allowancetype",
                    line: count,
                    value: stAllowanceType
                });
                sublistAllowance.setSublistValue({
                    id: "custpage_allowancestartdate",
                    line: count,
                    value: arrAllowances[intIndex].allowancestartdate
                });
                sublistAllowance.setSublistValue({
                    id: "custpage_allowanceenddate",
                    line: count,
                    value: stAllowanceEndDate
                });
                sublistAllowance.setSublistValue({
                    id: "custpage_allowanceamount",
                    line: count,
                    value: arrAllowances[intIndex].allowanceamount
                });
                count++;
            }
        }
    }

    function addColumnsToExpenseReportDetailsSublist(form, sublist) {
        sublist.addField({
            id: 'custpage_expensereporttranid',
            type: serverWidget.FieldType.TEXT,
            label: 'Expense Report #'
        }).updateDisplayType({ displayType : serverWidget.FieldDisplayType.DISABLED });

        sublist.addField({
            id: 'custpage_expensereportcategory',
            type: serverWidget.FieldType.TEXT,
            label: 'Category'
        }).updateDisplayType({ displayType : serverWidget.FieldDisplayType.DISABLED });

        sublist.addField({
            id: 'custpage_expensereportemployee',
            type: serverWidget.FieldType.TEXT,
            label: 'Employee'
        }).updateDisplayType({ displayType : serverWidget.FieldDisplayType.DISABLED });

        sublist.addField({
            id: 'custpage_expensereportdate',
            type: serverWidget.FieldType.TEXT,
            label: 'Date'
        }).updateDisplayType({ displayType : serverWidget.FieldDisplayType.DISABLED });

        sublist.addField({
            id: 'custpage_expensereportmemo',
            type: serverWidget.FieldType.TEXTAREA,
            label: 'Memo'
        }).updateDisplayType({ displayType : serverWidget.FieldDisplayType.DISABLED });

        sublist.addField({
            id: 'custpage_expensereportstatus',
            type: serverWidget.FieldType.TEXT,
            label: 'Status'
        }).updateDisplayType({ displayType : serverWidget.FieldDisplayType.DISABLED });

        sublist.addField({
            id: 'custpage_expensereportamount',
            type: serverWidget.FieldType.CURRENCY,
            label: 'Amount'
        }).updateDisplayType({ displayType : serverWidget.FieldDisplayType.NORMAL });

    }

    function populateExpenseReportDetailsSublist(recPayCycle, arrEmployees, sublistExpenseReport) {
        if(arrEmployees.length == 0) { return; }
        var count = 0;
        if(recPayCycle.getValue('custrecord_sr_pc_status') != 4) { // VOID
            // var arrExpenseReports = libHelper.getEmployeeExpenseReports(arrEmployees, recPayCycle.getText('custrecord_sr_pc_start_date'), recPayCycle.getText('custrecord_sr_pc_end_date'));
                var arrExpenseReports = libHelper.getEmployeeExpenseReportDetailsPerPayCycle(recPayCycle.id);

            for (var intIndex in arrExpenseReports) {
                var urlExpenseReport= "https://3688201.app.netsuite.com/app/accounting/transactions/exprept.nl?id="+arrExpenseReports[intIndex].recordid;
                var htmlExpenseReport = "<a class='dottedlink uir-hoverable-anchor' href='"+urlExpenseReport+"'>"+arrExpenseReports[intIndex].tranid+"</a>";
                sublistExpenseReport.setSublistValue({
                    id: "custpage_expensereporttranid",
                    line: count,
                    value: htmlExpenseReport
                });
                sublistExpenseReport.setSublistValue({
                    id: "custpage_expensereportcategory",
                    line: count,
                    value: (arrExpenseReports[intIndex].expensecategory != "") ? arrExpenseReports[intIndex].expensecategory : " "
                });
                sublistExpenseReport.setSublistValue({
                    id: "custpage_expensereportemployee",
                    line: count,
                    value: (arrExpenseReports[intIndex].entityname != "") ? arrExpenseReports[intIndex].entityname : " "
                });
                sublistExpenseReport.setSublistValue({
                    id: "custpage_expensereportdate",
                    line: count,
                    value: (arrExpenseReports[intIndex].trandate != "") ? arrExpenseReports[intIndex].trandate : " "
                });
                sublistExpenseReport.setSublistValue({
                    id: "custpage_expensereportmemo",
                    line: count,
                    value: (arrExpenseReports[intIndex].memo != "") ? arrExpenseReports[intIndex].memo : " "
                });
                sublistExpenseReport.setSublistValue({
                    id: "custpage_expensereportamount",
                    line: count,
                    value: (arrExpenseReports[intIndex].fxamount != "") ? arrExpenseReports[intIndex].fxamount : " "
                });
                sublistExpenseReport.setSublistValue({
                    id: "custpage_expensereportstatus",
                    line: count,
                    value: (arrExpenseReports[intIndex].statustext != "") ? arrExpenseReports[intIndex].statustext : " "
                });
                count++;
            }
        }
    }

    function addColumnsToExpenseReportSublist(form, sublist) {

        sublist.addField({
            id: 'custpage_expensereporttranid',
            type: serverWidget.FieldType.TEXT,
            label: 'Expense Report #'
        }).updateDisplayType({ displayType : serverWidget.FieldDisplayType.DISABLED });

        sublist.addField({
            id: 'custpage_expensereportemployee',
            type: serverWidget.FieldType.TEXT,
            label: 'Employee'
        }).updateDisplayType({ displayType : serverWidget.FieldDisplayType.DISABLED });

        sublist.addField({
            id: 'custpage_expensereportdate',
            type: serverWidget.FieldType.TEXT,
            label: 'Date'
        }).updateDisplayType({ displayType : serverWidget.FieldDisplayType.DISABLED });

        sublist.addField({
            id: 'custpage_expensereportstatus',
            type: serverWidget.FieldType.TEXT,
            label: 'Status'
        }).updateDisplayType({ displayType : serverWidget.FieldDisplayType.DISABLED });

        sublist.addField({
            id: 'custpage_expensereportamount',
            type: serverWidget.FieldType.CURRENCY,
            label: 'Amount'
        }).updateDisplayType({ displayType : serverWidget.FieldDisplayType.NORMAL });


    }

    function populateExpenseReportSublist(recPayCycle, arrEmployees, sublistExpenseReport) {
        if(arrEmployees.length == 0) { return; }
        var count = 0;
        if(recPayCycle.getValue('custrecord_sr_pc_status') != 4) { // VOID
            // var arrExpenseReports = libHelper.getEmployeeExpenseReports(arrEmployees, recPayCycle.getText('custrecord_sr_pc_start_date'), recPayCycle.getText('custrecord_sr_pc_end_date'));
            var arrExpenseReports = libHelper.getEmployeeExpenseReportsPerPayCycle(recPayCycle.id);

            for (var intIndex in arrExpenseReports) {
                var urlExpenseReport= "https://3688201.app.netsuite.com/app/accounting/transactions/exprept.nl?id="+arrExpenseReports[intIndex].recordid;
                var htmlExpenseReport = "<a class='dottedlink uir-hoverable-anchor' href='"+urlExpenseReport+"'>"+arrExpenseReports[intIndex].tranid+"</a>";
                sublistExpenseReport.setSublistValue({
                    id: "custpage_expensereporttranid",
                    line: count,
                    value: htmlExpenseReport
                });
                sublistExpenseReport.setSublistValue({
                    id: "custpage_expensereportemployee",
                    line: count,
                    value: (arrExpenseReports[intIndex].entityname != "") ? arrExpenseReports[intIndex].entityname : " "
                });
                sublistExpenseReport.setSublistValue({
                    id: "custpage_expensereportdate",
                    line: count,
                    value: (arrExpenseReports[intIndex].trandate != "") ? arrExpenseReports[intIndex].trandate : " "
                });
                sublistExpenseReport.setSublistValue({
                    id: "custpage_expensereportamount",
                    line: count,
                    value: (arrExpenseReports[intIndex].fxamount != "") ? arrExpenseReports[intIndex].fxamount : " "
                });
                sublistExpenseReport.setSublistValue({
                    id: "custpage_expensereportstatus",
                    line: count,
                    value: (arrExpenseReports[intIndex].statustext != "") ? arrExpenseReports[intIndex].statustext : " "
                });
                count++;
            }
        }
    }

    function addColumnsToCommissionSublist(form, sublist) {

        sublist.addField({
            id: 'custpage_commissiontranid',
            type: serverWidget.FieldType.TEXT,
            label: 'Commission #'
        }).updateDisplayType({ displayType : serverWidget.FieldDisplayType.DISABLED });

        sublist.addField({
            id: 'custpage_commissionemployee',
            type: serverWidget.FieldType.TEXT,
            label: 'Employee'
        }).updateDisplayType({ displayType : serverWidget.FieldDisplayType.DISABLED });

        sublist.addField({
            id: 'custpage_commissiondate',
            type: serverWidget.FieldType.TEXT,
            label: 'Date'
        }).updateDisplayType({ displayType : serverWidget.FieldDisplayType.DISABLED });

        sublist.addField({
            id: 'custpage_commissionstatus',
            type: serverWidget.FieldType.TEXT,
            label: 'Status'
        }).updateDisplayType({ displayType : serverWidget.FieldDisplayType.DISABLED });

        sublist.addField({
            id: 'custpage_commissionamount',
            type: serverWidget.FieldType.CURRENCY,
            label: 'Amount'
        }).updateDisplayType({ displayType : serverWidget.FieldDisplayType.NORMAL });
    }

    function populateCommissionSublist(recPayCycle, arrEmployees, sublistCommission) {
        if(arrEmployees.length == 0) { return; }
        var count = 0;
        if(recPayCycle.getValue('custrecord_sr_pc_status') != 4) { // VOID
            var arrCommissions = libHelper.getEmployeeCommissions(arrEmployees, recPayCycle.getText('custrecord_sr_pc_start_date'), recPayCycle.getText('custrecord_sr_pc_end_date'));

            for (var intIndex in arrCommissions) {
                var urlCommission= "https://3688201-sb1.app.netsuite.com/app/accounting/transactions/transaction.nl?id="+arrCommissions[intIndex].recordid;
                var htmlCommission= "<a class='dottedlink uir-hoverable-anchor' href='"+urlCommission+"'>"+arrCommissions[intIndex].tranid+"</a>";

                sublistCommission.setSublistValue({
                    id: "custpage_commissiontranid",
                    line: count,
                    value: htmlCommission
                });
                sublistCommission.setSublistValue({
                    id: "custpage_commissionemployee",
                    line: count,
                    value: arrCommissions[intIndex].entityname
                });
                sublistCommission.setSublistValue({
                    id: "custpage_commissiondate",
                    line: count,
                    value: arrCommissions[intIndex].trandate
                });
                sublistCommission.setSublistValue({
                    id: "custpage_commissionamount",
                    line: count,
                    value: arrCommissions[intIndex].fxamount
                });
                sublistCommission.setSublistValue({
                    id: "custpage_commissionstatus",
                    line: count,
                    value: arrCommissions[intIndex].statustext
                });
                count++;
            }
        }
    }

    function addColumnsToEmployeeSublist(form, sublist) {

        sublist.addField({
            id: 'custpage_employee',
            type: serverWidget.FieldType.SELECT,
            label: 'Employee',
            source:'employee'
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

        sublist.addField({
            id: 'custpage_costcenter',
            type: serverWidget.FieldType.TEXT,
            label: 'Cost Center'
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

    }

    function populateEmployeeSublist(recPayCycle, sublistEmployee) {
        var objEmployeePayroll = libHelper.getAllEmployeesPayroll(recPayCycle.getText('custrecord_sr_pc_start_date'),recPayCycle.getText('custrecord_sr_pc_end_date'), recPayCycle.getValue('custrecord_payroll_provider'));
        var count = 0;
        for (var intIndex in objEmployeePayroll) {
            sublistEmployee.setSublistValue({ id: "custpage_employee", line: count, value: intIndex });
            sublistEmployee.setSublistValue({ id: "custpage_costcenter", line: count, value: objEmployeePayroll[intIndex].cost_center });
            count++;
        }
    }

    function getTimeOffRequests(arrTimeOffRequestsIds)  {
        var arrTimeOffRequestsDetails = [];
        var timeoffrequestSearchObj = search.create({
            type: "timeoffrequest",
            filters: [["internalid","anyof", arrTimeOffRequestsIds]],
            columns: [
                search.createColumn({name: "internalid"}),
                search.createColumn({name: "employee"}),
                search.createColumn({name: "startdate"}),
                search.createColumn({name: "enddate"}),
                search.createColumn({name: "amountoftime",join: "timeOffRequestDetail"}),
                search.createColumn({name: "timeofftype",join: "timeOffRequestDetail"}),
                search.createColumn({ name: "timeunit", join: "timeOffRequestDetail", sort: search.Sort.ASC}),
                search.createColumn({ name: "timeoffdate", join: "timeOffRequestDetail"})
            ]
        });

        var searchResultCount = timeoffrequestSearchObj.runPaged().count;
        if(searchResultCount != 0) {
            timeoffrequestSearchObj.run().each(function(result) {
                var timeunit = result.getValue({ name: "timeunit",join: "timeOffRequestDetail" });
                var amountoftime = (timeunit == 'DAYS') ? parseFloat(parseFloat(result.getValue({ name: "amountoftime", join: "timeOffRequestDetail"})) * 8) : result.getValue({ name: "amountoftime", join: "timeOffRequestDetail"});

                arrTimeOffRequestsDetails.push({
                    recordid: result.getValue({ name: "internalid"}),
                    employee: result.getValue({ name: "employee"}),
                    startdate: result.getValue({ name: "startdate"}),
                    enddate: result.getValue({ name: "enddate"}),
                    timeofftype: result.getValue({ name: "timeofftype",join: "timeOffRequestDetail" }),
                    timeoffdate: result.getValue({ name: "timeoffdate",join: "timeOffRequestDetail" }),
                    timeunit: timeunit,
                    amountoftime: amountoftime
                });
                return true;
            });
        }

        return arrTimeOffRequestsDetails;
    }

    function getTimeOffRequestAssociations(arrTimeOffRequestsIds, dtStartDate, dtEndDate)  {
        var arrTimeOffRequestsDetails = [];
        var timeoffrequestSearchObj = search.create({
            type: "customrecord_sr_pc_time_off_assoc",
            filters: [
                ["custrecord_sr_pc_time_off_record","anyof", arrTimeOffRequestsIds], "AND",
                ["custrecord_sr_pc_time_off_header","anyof","@NONE@"],// "AND",
                //["custrecord_startdate","onorafter",[format.format({ value: dtStartDate, type: format.Type.DATE })]], "AND",
                //["custrecord_enddate","onorbefore",[format.format({ value: dtEndDate, type: format.Type.DATE })]]
            ],
            columns: [
                search.createColumn({name: "custrecord_sr_pc_time_off_record"}),
                search.createColumn({name: "custrecord_sr_pc_time_off_employee"}),
                search.createColumn({name: "custrecord_sr_pc_time_off_header"}),
                search.createColumn({name: "custrecord_timeofftype_paycode"}),
                search.createColumn({name: "custrecord_timeofftype"}),
                search.createColumn({name: "custrecord_startdate"}),
                search.createColumn({name: "custrecord_enddate"}),
                search.createColumn({name: "custrecord_sr_pc_amount_of_time"}),
                search.createColumn({name: "custentity_employee_number", join: 'custrecord_sr_pc_time_off_employee'}),
                search.createColumn({name: "department", join: 'custrecord_sr_pc_time_off_employee'})
            ]
        });

        var searchResultCount = timeoffrequestSearchObj.runPaged().count;
        if(searchResultCount != 0) {
            timeoffrequestSearchObj.run().each(function(result) {

                arrTimeOffRequestsDetails.push({
                    recordid: result.id,
                    custrecord_sr_pc_time_off_record: result.getValue({ name: "custrecord_sr_pc_time_off_record"}),
                    custrecord_sr_pc_time_off_employee: result.getValue({ name: "custrecord_sr_pc_time_off_employee"}),
                    custrecord_timeofftype_paycode: result.getValue({ name: "custrecord_timeofftype_paycode"}),
                    custrecord_timeofftype: result.getValue({ name: "custrecord_timeofftype"}),
                    custrecord_timeofftype_name: result.getText({ name: "custrecord_timeofftype"}),
                    custrecord_startdate: result.getValue({ name: "custrecord_startdate"}),
                    custrecord_enddate: result.getValue({ name: "custrecord_enddate"}),
                    custrecord_sr_pc_amount_of_time: result.getValue({ name: "custrecord_sr_pc_amount_of_time"}),
                    custrecord_sr_pc_time_off_header: result.getValue({ name: "custrecord_sr_pc_time_off_header"}),
                    employeenumber: result.getValue({name: "custentity_employee_number", join: 'custrecord_sr_pc_time_off_employee'}),
                    costcenter: result.getText({name: "department", join: 'custrecord_sr_pc_time_off_employee'})
                });
                return true;
            });
        }

        return arrTimeOffRequestsDetails;
    }

    function beforeSubmit(context) {
        var newRecord = context.newRecord;
        var arrPayCycleLinesId = [];
        var objPayCycleLineId = {};
        var arrTimeOffRequestsIds = [];
        if(newRecord.getValue('custrecord_sr_pc_status') != 4) {
            if(context.type != 'edit') { return; }
            var stDeletedData = newRecord.getValue('custpage_deleteddatastorage');
            var hasData = (stDeletedData != "") ? true : false;

            if(typeof stDeletedData != "undefined" && stDeletedData != "") {
                var objDeletedData = JSON.parse(stDeletedData);
                for(var intIndex in objDeletedData) {
                    var recTimeOffRequestAssociation = record.create({ type: "customrecord_sr_pc_time_off_assoc", isDynamic: true });
                    recTimeOffRequestAssociation.setValue('custrecord_sr_pc_time_off_record', objDeletedData[intIndex].custrecord_sr_pc_time_off_record);
                    recTimeOffRequestAssociation.setValue('custrecord_sr_pc_time_off_employee', objDeletedData[intIndex].custrecord_sr_pc_time_off_employee);
                    recTimeOffRequestAssociation.setValue('custrecord_timeofftype_paycode', objDeletedData[intIndex].custrecord_timeofftype_paycode);
                    recTimeOffRequestAssociation.setValue('custrecord_startdate', libHelper.getFormattedDate(objDeletedData[intIndex].custrecord_startdate));
                    recTimeOffRequestAssociation.setValue('custrecord_enddate', libHelper.getFormattedDate(objDeletedData[intIndex].custrecord_enddate));
                    recTimeOffRequestAssociation.setValue('custrecord_timeofftype', objDeletedData[intIndex].custrecord_timeofftype);
                    recTimeOffRequestAssociation.setValue('custrecord_sr_pc_amount_of_time', objDeletedData[intIndex].custrecord_sr_pc_amount_of_time);
                    recTimeOffRequestAssociation.setValue('custrecord_sr_pc_for_reversal', objDeletedData[intIndex].custrecord_sr_pc_for_reversal);
                    recTimeOffRequestAssociation.setValue('custrecord_sr_pc_is_cancelled', objDeletedData[intIndex].custrecord_sr_pc_is_cancelled);
                    log.debug('Association', recTimeOffRequestAssociation.save());
                }
            }

            for (var intIndex=0; intIndex<newRecord.getLineCount('recmachcustrecord_sr_pcl_paycycleheader'); intIndex++) {
                var intPayCycleLineId = newRecord.getSublistValue({sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'id', line: intIndex});
                if(intPayCycleLineId != "") {
                    arrPayCycleLinesId.push(intPayCycleLineId);
                }

                if(objPayCycleLineId[intPayCycleLineId] == null) { objPayCycleLineId[intPayCycleLineId] = {}; }
                objPayCycleLineId[intPayCycleLineId] = {
                    paycyclelineid : intPayCycleLineId,
                    paycyclelineamount: newRecord.getSublistValue({sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_quantity', line: intIndex})
                };
            }

            if(arrPayCycleLinesId.length != 0) {
                var arrAllowancePayments = libHelper.getPayCycleAllowancePayments(newRecord.id, arrPayCycleLinesId);

                for(var intIndex in arrAllowancePayments) {
                    if(objPayCycleLineId[arrAllowancePayments[intIndex].paycyclelineid].paycyclelineamount != arrAllowancePayments[intIndex].amountpaid) {
                        record.submitFields({
                            type: "customrecord_sr_pc_allowance_payment",
                            id: arrAllowancePayments[intIndex].allowancepaymentid,
                            values: { custrecord_sr_allowance_amount_paid: objPayCycleLineId[arrAllowancePayments[intIndex].paycyclelineid].paycyclelineamount }
                        });
                    }
                }
            }

            /** PROCESS MANUALLY ADDED TIME-OFF REQUESTS **/
            for (var intIndex=newRecord.getLineCount('recmachcustrecord_sr_pc_time_off_header')-1; intIndex>=0; intIndex--) {
                var intTimeOffRequestAssociationId = newRecord.getSublistValue({sublistId: 'recmachcustrecord_sr_pc_time_off_header',fieldId: 'id',line: intIndex});
                if(intTimeOffRequestAssociationId == "") {
                    // log.debug('timeoff assoc', newRecord.getSublistValue({sublistId: 'recmachcustrecord_sr_pc_time_off_header',fieldId: 'custrecord_sr_pc_time_off_record',line: intIndex}));
                    arrTimeOffRequestsIds.push(newRecord.getSublistValue({sublistId: 'recmachcustrecord_sr_pc_time_off_header',fieldId: 'custrecord_sr_pc_time_off_record',line: intIndex}));
                    newRecord.removeLine({ sublistId: 'recmachcustrecord_sr_pc_time_off_header', line: intIndex });
                }
            }

            if(arrTimeOffRequestsIds.length != 0) {
                var objEmployees = {};
                var objCostCenterOverride = {};
                var objPayCodes = {};
                var intPayCycleLineId = parseInt(newRecord.getLineCount('recmachcustrecord_sr_pcl_paycycleheader'));
                var dtStartDate = format.parse({ value: newRecord.getText('custrecord_sr_pc_start_date'), type: format.Type.DATE });
                var dtEndDate = format.parse({ value: newRecord.getText('custrecord_sr_pc_end_date'), type: format.Type.DATE });
                var intPayrollProvider = newRecord.getValue('custrecord_payroll_provider');
                var arrTimeOffRequestsAssociation = getTimeOffRequestAssociations(arrTimeOffRequestsIds, dtStartDate, dtEndDate);
                var objTimeOffTypes = libHelper.getTimeOffTypes();
                var recPayrollProvider = record.load({type: "customrecord_payroll_provider", id: intPayrollProvider, isDynamic: true });
                var arrTimeOffTypes = recPayrollProvider.getText('custrecord_timeoff_types');
                if(recPayrollProvider.getValue('custrecord_sr_cost_center_override') != '') { objCostCenterOverride = JSON.parse(recPayrollProvider.getValue('custrecord_sr_cost_center_override')); }
                if(recPayrollProvider.getValue('custrecord_sr_pp_paycode_id') != '') { objPayCodes = JSON.parse(recPayrollProvider.getValue('custrecord_sr_pp_paycode_id')); }

                var intTimeOffRequestAssociationCount = parseInt(newRecord.getLineCount('recmachcustrecord_sr_pc_time_off_header'));
                for(var intIndex in arrTimeOffRequestsAssociation) {
                    // var lineNumber = newRecord.findSublistLineWithValue({ sublistId: 'recmachcustrecord_sr_pc_time_off_header', fieldId: 'custrecord_sr_pc_time_off_record', value: arrTimeOffRequests[intIndex].recordid });
                    // if(lineNumber == -1) {
                    var dtLeaveStartDate = libHelper.getFormattedDate(arrTimeOffRequestsAssociation[intIndex].custrecord_startdate);
                    var dtLeaveEndDate = libHelper.getFormattedDate(arrTimeOffRequestsAssociation[intIndex].custrecord_enddate);

                    if(objEmployees[arrTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_time_off_employee] == null) {
                        objEmployees[arrTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_time_off_employee] = { data:[] };
                    }

                    var stCode = (typeof arrTimeOffRequestsAssociation[intIndex].employeenumber == 'undefined') ? "" : arrTimeOffRequestsAssociation[intIndex].employeenumber;
                    var stCostCenter = (typeof arrTimeOffRequestsAssociation[intIndex].costcenter == 'undefined') ? "" : arrTimeOffRequestsAssociation[intIndex].costcenter;
                    var stPayCode = "";

                    if(libHelper.existInArrTimeOffTypes(arrTimeOffTypes, arrTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name)) {
                        if(intPayrollProvider == 1) {
                            if(typeof objPayCodes[arrTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name] != 'undefined') {
                                stPayCode = objPayCodes[arrTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name];
                            } else { stPayCode = ""; }
                        } else {
                            if(typeof objPayCodes[arrTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name] != 'undefined') {
                                stPayCode = objPayCodes[arrTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name];
                            } else {
                                if(arrTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name != "") {
                                    stPayCode = arrTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name;
                                } else { stPayCode = "Other Unpaid Leave"; }
                            }
                        }
                    } else { stPayCode = "Other Unpaid Leave"; }

                    objEmployees[arrTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_time_off_employee].data.push({
                        code: stCode,
                        cost_center: (typeof objCostCenterOverride[stCostCenter] !='undefined') ? objCostCenterOverride[stCostCenter] : stCostCenter,
                        paycode_id: stPayCode,
                        timeoffrequestassociationid: arrTimeOffRequestsAssociation[intIndex].recordid,
                        total_working_hours: arrTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_amount_of_time,
                        payroll_start: libHelper.padnumber('00',dtStartDate.getDate())+libHelper.padnumber('00',parseInt(dtStartDate.getMonth()+1))+dtStartDate.getFullYear(),
                        payroll_end: libHelper.padnumber('00',dtEndDate.getDate())+libHelper.padnumber('00',parseInt(dtEndDate.getMonth()+1))+dtEndDate.getFullYear(),
                        leave_start: libHelper.padnumber('00',dtLeaveStartDate.getDate())+libHelper.padnumber('00',parseInt(dtLeaveStartDate.getMonth()+1))+dtLeaveStartDate.getFullYear(),
                        leave_end: libHelper.padnumber('00',dtLeaveEndDate.getDate())+libHelper.padnumber('00',parseInt(dtLeaveEndDate.getMonth()+1))+dtLeaveEndDate.getFullYear(),
                        number_pays: '1.00',
                        alter_rate: 0,
                    });
                    // }

                    // log.debug('arrTimeOffRequestsAssociation['+intIndex+']', arrTimeOffRequestsAssociation[intIndex]);
                    newRecord.insertLine({sublistId: 'recmachcustrecord_sr_pc_time_off_header',line: intTimeOffRequestAssociationCount});
                    newRecord.setSublistValue({ sublistId: 'recmachcustrecord_sr_pc_time_off_header', fieldId: 'custrecord_sr_pc_time_off_header', line: intTimeOffRequestAssociationCount, value: newRecord.id });
                    newRecord.setSublistValue({ sublistId: 'recmachcustrecord_sr_pc_time_off_header', fieldId: 'custrecord_timeofftype_paycode', line: intTimeOffRequestAssociationCount, value: stPayCode });
                    newRecord.setSublistValue({ sublistId: 'recmachcustrecord_sr_pc_time_off_header', fieldId: 'custrecord_sr_pc_time_off_record', line: intTimeOffRequestAssociationCount, value: arrTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_time_off_record });
                    newRecord.setSublistValue({ sublistId: 'recmachcustrecord_sr_pc_time_off_header', fieldId: 'id', line: intTimeOffRequestAssociationCount, value: arrTimeOffRequestsAssociation[intIndex].recordid });
                    newRecord.setSublistValue({ sublistId: 'recmachcustrecord_sr_pc_time_off_header', fieldId: 'custrecord_timeofftype', line: intTimeOffRequestAssociationCount, value: arrTimeOffRequestsAssociation[intIndex].custrecord_timeofftype });
                    newRecord.setSublistValue({ sublistId: 'recmachcustrecord_sr_pc_time_off_header', fieldId: 'custrecord_startdate', line: intTimeOffRequestAssociationCount, value: libHelper.getFormattedDate(arrTimeOffRequestsAssociation[intIndex].custrecord_startdate) });
                    newRecord.setSublistValue({ sublistId: 'recmachcustrecord_sr_pc_time_off_header', fieldId: 'custrecord_enddate', line: intTimeOffRequestAssociationCount, value: libHelper.getFormattedDate(arrTimeOffRequestsAssociation[intIndex].custrecord_enddate) });
                    newRecord.setSublistValue({ sublistId: 'recmachcustrecord_sr_pc_time_off_header', fieldId: 'custrecord_sr_pc_amount_of_time', line: intTimeOffRequestAssociationCount, value: arrTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_amount_of_time });
                    intTimeOffRequestAssociationCount++;
                }

                /** APPEND PAY CYCLE LINES**/
                for(var intIndex in objEmployees) {
                    for(var intIndexData in objEmployees[intIndex].data) {
                        /** Update Original Total Hours **/
                        if(recPayrollProvider.getValue('custrecord_sr_pp_ordinary_paycodeid') != '') {
                            for (var intIndexPayCycleHeader=0; intIndexPayCycleHeader<newRecord.getLineCount('recmachcustrecord_sr_pcl_paycycleheader'); intIndexPayCycleHeader++) {
                                var stOriginalPaycode = newRecord.getSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_paycode_id', line: intIndexPayCycleHeader });
                                var stOriginalEmployeeId = newRecord.getSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_employee_id', line: intIndexPayCycleHeader });
                                var flOriginalHours = parseFloat(newRecord.getSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_quantity', line: intIndexPayCycleHeader }));
                                if(stOriginalEmployeeId == intIndex && stOriginalPaycode == recPayrollProvider.getValue('custrecord_sr_pp_ordinary_paycodeid')) {
                                    flOriginalHours =  parseFloat(flOriginalHours - parseFloat(objEmployees[intIndex].data[intIndexData].total_working_hours));
                                    newRecord.setSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_quantity', line: intIndexPayCycleHeader, value: parseFloat(flOriginalHours).toFixed(2) });
                                }
                            }
                        }

                        newRecord.setSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_employee_id', line: intPayCycleLineId, value: intIndex });
                        newRecord.setSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_employee_code', line: intPayCycleLineId, value: objEmployees[intIndex].data[intIndexData].code });
                        newRecord.setSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_cost_center_code', line: intPayCycleLineId, value: objEmployees[intIndex].data[intIndexData].cost_center });
                        newRecord.setSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_paycode_id', line: intPayCycleLineId, value: objEmployees[intIndex].data[intIndexData].paycode_id });
                        newRecord.setSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_quantity', line: intPayCycleLineId, value: objEmployees[intIndex].data[intIndexData].total_working_hours });
                        newRecord.setSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_payroll_start', line: intPayCycleLineId, value: objEmployees[intIndex].data[intIndexData].payroll_start });
                        newRecord.setSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_end', line: intPayCycleLineId, value: objEmployees[intIndex].data[intIndexData].payroll_end });
                        newRecord.setSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_leave_start', line: intPayCycleLineId, value: objEmployees[intIndex].data[intIndexData].leave_start });
                        newRecord.setSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_leave_end', line: intPayCycleLineId, value: objEmployees[intIndex].data[intIndexData].leave_end });
                        newRecord.setSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_number_pays', line: intPayCycleLineId, value: objEmployees[intIndex].data[intIndexData].number_pays });
                        newRecord.setSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_alternative_rate', line: intPayCycleLineId, value: objEmployees[intIndex].data[intIndexData].alter_rate });
                        if(typeof objEmployees[intIndex].data[intIndexData].timeoffrequestassociationid != 'undefined') {
                            newRecord.setSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_timeoff_association', line: intPayCycleLineId, value: objEmployees[intIndex].data[intIndexData].timeoffrequestassociationid });
                        }

                        intPayCycleLineId++;
                    }
                }
            }

        } else {  // VOID
            var arrPayCycleLineIds = [];
            var intPayCycleLineCount = parseInt(newRecord.getLineCount('recmachcustrecord_sr_pcl_paycycleheader'))-1;
            for(var intIndexPayCycleLine=intPayCycleLineCount; intIndexPayCycleLine>=0; intIndexPayCycleLine--) {
                arrPayCycleLineIds.push(newRecord.getSublistValue('recmachcustrecord_sr_pcl_paycycleheader','id',intIndexPayCycleLine));
            }

            task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: "customscript_lcc_mr_void_paycycle",
                deploymentId: "customdeploy_lcc_mr_void_timeoffrequest",
                params: {
                    custscript_void_param_data: JSON.stringify({
                        intPayCycleId: newRecord.id,
                        recordtype: "timeoffrequest"
                    })
                }
            }).submit();

            task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: "customscript_lcc_mr_void_paycycle",
                deploymentId: "customdeploy_lcc_mr_void_pc_bonus",
                params: {
                    custscript_void_param_data: JSON.stringify({
                        intPayCycleId: newRecord.id,
                        recordtype: "bonus"
                    })
                }
            }).submit();

            task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: "customscript_lcc_mr_void_paycycle",
                deploymentId: "customdeploy_lcc_mr_void_expensereport",
                params: {
                    custscript_void_param_data: JSON.stringify({
                        intPayCycleId: newRecord.id,
                        recordtype: "expensereport"
                    })
                }
            }).submit();

            task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: "customscript_lcc_mr_void_paycycle",
                deploymentId: "customdeploy_lcc_mr_void_pc_allowance",
                params: {
                    custscript_void_param_data: JSON.stringify({
                        intPayCycleId: newRecord.id,
                        recordtype: "allowance",
                        arrPayCycleLineIds: arrPayCycleLineIds
                    })
                }
            }).submit();

            task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: "customscript_lcc_mr_void_paycycle",
                deploymentId: "customdeploy_lcc_mr_void_paycycle",
                params: {
                    custscript_void_param_data: JSON.stringify({
                        intPayCycleId: newRecord.id,
                        recordtype: "paycycleline"
                    })
                }
            }).submit();

            task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: "customscript_lcc_mr_void_paycycle",
                deploymentId: "customdeploy_lcc_mr_void_pc_employee",
                params: {
                    custscript_void_param_data: JSON.stringify({
                        intPayCycleId: newRecord.id,
                        recordtype: "employee"
                    })
                }
            }).submit();

            // var arrPayCycleLineIds = [];
            // var intEmployeeCount = parseInt(newRecord.getLineCount('recmachcustrecord_sr_pc_pay_cycle_header'))-1;
            // var intPayCycleLineCount = parseInt(newRecord.getLineCount('recmachcustrecord_sr_pcl_paycycleheader'))-1;
            //
            // /** REMOVE EMPLOYEE LISTS IN THE PAY CYCLE **/
            // for(var intIndexEmployee=intEmployeeCount; intIndexEmployee>=0; intIndexEmployee--) {
            //     newRecord.removeLine({ sublistId: 'recmachcustrecord_sr_pc_pay_cycle_header', line: intIndexEmployee });
            // }
            //
            // /** REMOVE ALLOWANCE PAYMENTS IN THE PAY CYCLE **/
            // for(var intIndexPayCycleLine=intPayCycleLineCount; intIndexPayCycleLine>=0; intIndexPayCycleLine--) {
            //     arrPayCycleLineIds.push(newRecord.getSublistValue('recmachcustrecord_sr_pcl_paycycleheader','id',intIndexPayCycleLine));
            // }
            //
            // var arrAllowancePayments = libHelper.getPayCycleAllowancePayments(newRecord.id, arrPayCycleLineIds);
            // if(arrAllowancePayments.length != 0) {
            //     for(var intIndex in arrAllowancePayments) {
            //         record.submitFields({
            //             type: "customrecord_sr_pc_allowance_payment",
            //             id: arrAllowancePayments[intIndex].allowancepaymentid,
            //             values: { custrecord_sr_pay_cycle_header: "", custrecord_sr_pay_cycle_line_header:"" }
            //         });
            //     }
            // }
            //
            // /** REMOVE BONUS ASSOCIATION **/
            // var arrBonusAssociations = libHelper.getBonusAssociation(newRecord.id);
            // if(arrBonusAssociations.length != 0) {
            //     for(var intIndex in arrBonusAssociations) {
            //         record.delete({
            //             type: "customrecord_sr_pc_bonus_association",
            //             id: arrBonusAssociations[intIndex].bonusassociationid
            //         });
            //     }
            // }
            //
            // /** REMOVE PAY CYCLE LINES IN THE PAY CYCLE **/
            // for(var intIndexPayCycleLine=intPayCycleLineCount; intIndexPayCycleLine>=0; intIndexPayCycleLine--) {
            //     newRecord.removeLine({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', line: intIndexPayCycleLine });
            // }
        }
    }

    function afterSubmit(context) {
        try {
            var newRecord = context.newRecord;

            if(newRecord.getValue('custrecord_sr_pc_status') == 4) {
            //     /** REMOVE TIME-OFF REQUESTS IN THE PAY CYCLE **/
            //     for(var intIndexTimeOffRequest=intTimeOffRequestCount; intIndexTimeOffRequest>=0; intIndexTimeOffRequest--) {
            //         // newRecord.removeLine({ sublistId: 'recmachcustrecord_sr_pc_time_off_header', line: intIndexTimeOffRequest });
            //         var intTimeOffRequestAssociationId = newRecord.getSublistValue({ sublistId: 'recmachcustrecord_sr_pc_time_off_header', fieldId:'id', line: intIndexTimeOffRequest });
            //
            //         var recId = record.submitFields({
            //             type: "customrecord_sr_pc_time_off_assoc",
            //             id: intTimeOffRequestAssociationId,
            //             values: { custrecord_sr_pc_time_off_header: "" }
            //         });
            //     }
            //
            //     /** REMOVE EXPENSE REPORTS TAGGING **/
            //     var arrExpenseReports = libHelper.getEmployeeExpenseReportsPerPayCycle(newRecord.id);
            //     if(arrExpenseReports.length != 0) {
            //         for(var intIndex  in arrExpenseReports) {
            //             record.submitFields({
            //                 type: "expensereport",
            //                 id: arrExpenseReports[intIndex].recordid,
            //                 values: { custbody_sr_pay_cycle: "" }
            //             });
            //         }
            //     }
            }

            /** CONFIRMED **/
            if(newRecord.getValue('custrecord_sr_pc_status') == 3) {
                task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: "customscript_sr_mr_process_payoff",
                    deploymentId: "customdeploy_sr_mr_process_expensereport",
                    params: { custscript_paycycleid: JSON.stringify({ "recordid": newRecord.id, "recordtype": "expensereport" }) }
                }).submit();

                task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: "customscript_sr_mr_process_payoff",
                    deploymentId: "customdeploy_sr_mr_process_bonus",
                    params: { custscript_paycycleid: JSON.stringify({ "recordid": newRecord.id, "recordtype": "bonus" }) }
                }).submit();

                // task.create({
                //     taskType: task.TaskType.MAP_REDUCE,
                //     scriptId: "customscript_sr_mr_process_payoff",
                //     deploymentId: "customdeploy_sr_mr_process_commissions",
                //     params: { custscript_paycycleid: JSON.stringify({ "recordid": newRecord.id, "recordtype": "commission" }) }
                // }).submit();
            }

        } catch(e) { log.debug('ERROR', e); }
    }

    function generatePCStatusField(context) {
        var form = context.form;
        var request = context.request;
        var objTaskIds = JSON.parse(request.parameters.custpage_objTasks);
        var stStatus = "<span class='smallgraytextnolink' style='font-size: 12px;'>PROCESSING STATUS</span>";
        stStatus += "<p>";

        if(typeof objTaskIds.paycycle != "undefined"){
            var stPayCyleStatus = getScheduledScriptStatus(objTaskIds.paycycle, "customdeploy_lcc_mr_process_paycycle_v2");
            stStatus += "Pay Cycle Line: "+stPayCyleStatus.toUpperCase()+"<br/>";
            stStatus += "Employee List: "+stPayCyleStatus.toUpperCase()+"<br/>";
            stStatus += "Time-off Requests: "+stPayCyleStatus.toUpperCase()+"<br/>";
        }

        if(typeof objTaskIds.bonus != "undefined"){
            var stBonusStatus = getScheduledScriptStatus(objTaskIds.bonus, "customdeploy_lcc_mr_process_pc_bonus_v2");
            stStatus += "Bonus: "+stBonusStatus.toUpperCase()+"<br/>";
        }

        if(typeof objTaskIds.allowance != "undefined"){
            var stAllowanceStatus = getScheduledScriptStatus(objTaskIds.allowance, "customdeploy_lcc_mr_process_pc_allowa_v2");
            stStatus += "Allowance: "+stAllowanceStatus.toUpperCase()+"<br/>";
        }

        if(typeof objTaskIds.expensereport != "undefined"){
            var stExpenseReportStatus = getScheduledScriptStatus(objTaskIds.expensereport, "customdeploy_lcc_mr_process_pc_er_v2");
            stStatus += "Expense Report: "+stExpenseReportStatus.toUpperCase()+"<br/>";
        }

        stStatus += "</p>";

        var objProcessStatus = form.addField({
            id : 'custpage_processstatus',
            type : serverWidget.FieldType.INLINEHTML,
            label : 'Processing Status'
        });//.updateDisplayType({ displayType : serverWidget.FieldDisplayType.DISABLED });
        objProcessStatus.defaultValue = stStatus
    }

    function generateVoidPCStatusField(context) {
        var form = context.form;
        var request = context.request;
        var stStatus = "<span class='smallgraytextnolink' style='font-size: 12px;'>PROCESSING STATUS</span>";
        stStatus += "<p>";
        if(getVoidScheduledScriptStatus()){
            stStatus += "PENDING VOID";
        } else {
            stStatus += "VOID COMPLETE";
        }

        stStatus += "</p>";

        var objProcessStatus = form.addField({
            id : 'custpage_processstatus',
            type : serverWidget.FieldType.INLINEHTML,
            label : 'Processing Status'
        });//.updateDisplayType({ displayType : serverWidget.FieldDisplayType.DISABLED });
        objProcessStatus.defaultValue = stStatus
    }

    function getScheduledScriptStatus(stTaskId,stScriptDeploymentId) {
        var stStatus = "";
        // var stScriptDeploymentId = 'customdeploy_lcc_ss_process_paycycle';
        var scheduledscriptinstanceSearchObj = search.create({
            type: "scheduledscriptinstance",
            filters: [
                ["scriptdeployment.scriptid","startswith", stScriptDeploymentId],'AND',
                ["taskid","contains",stTaskId]
            ],
            columns: [ search.createColumn({name: "status", label: "Status"}) ]
        });
        var searchResultCount = scheduledscriptinstanceSearchObj.runPaged().count;
        if(searchResultCount != 0) {
            scheduledscriptinstanceSearchObj.run().each(function(result) {
                stStatus = result.getValue('status');
                return true;
            });
        }
        return stStatus;
    }

    function getVoidScheduledScriptStatus(){
        var hasPendingForVoid = false;
        var scheduledscriptinstanceSearchObj = search.create({
            type: "scheduledscriptinstance",
            filters: [
                ["script.internalid","anyof","1432"], "AND",
                ["status","anyof","PENDING","PROCESSING"]
            ],
            columns: [
                search.createColumn({name: "status", label: "Status"}),
                search.createColumn({name: "mapreducestage", label: "Map/Reduce Stage"}),
                search.createColumn({name: "percentcomplete", label: "Percent Complete"}),
                search.createColumn({name: "queueposition", label: "Queue Position"})
            ]
        });
        var searchResultCount = scheduledscriptinstanceSearchObj.runPaged().count;
        if(searchResultCount != 0) {
            hasPendingForVoid = true;
        }
        return hasPendingForVoid;
    }

    return { beforeLoad: beforeLoad, beforeSubmit: beforeSubmit, afterSubmit: afterSubmit };

});