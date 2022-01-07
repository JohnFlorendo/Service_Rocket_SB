/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope Public
 */

/*
ID :
Name :
Purpose : This is a standalone client script for Sunday Riley
Created On :
Author : LCC
Script Type : Client Script
Saved Searches : NONE
*/

define(['N/search', 'N/currentRecord', 'N/ui/dialog','N/record','N/runtime'],
    function(search, currentRecord, dialog,objrecord, runtime) {

    var record = currentRecord.get();
    var userObj = runtime.getCurrentUser();
    var stDatePreference = userObj.getPreference({ name: "dateformat"});

    function saveRecord(context) {
        var stErrorMessage = "";
        var dtStartDate = record.getValue('custpage_startdate');
        var dtEndDate = record.getValue('custpage_enddate');
        var stEmployee = record.getValue('custpage_employee');
        var stPayrollProvider = record.getValue('custpage_payrollprovider');

       // if(stEmployee == "") { stErrorMessage += "Please Choose an Employee. \n"; }
        if(dtStartDate == "") { stErrorMessage += "Please Input Start Date.\n"; }
        if(dtEndDate == "") { stErrorMessage += "Please Input End Date.\n"; }
        if(stPayrollProvider == "") { stErrorMessage += "Please choose a payroll provider. \n" }

        if(dtStartDate != '' && dtEndDate != '') {
            var now = new Date();
            if(dtStartDate > dtEndDate) { stErrorMessage += "Invalid End Date. Should be greater than the start date. \n"; }
            // if(dtStartDate > now) { stErrorMessage += "Start Date can only be dates before today. \n" }
            // if(dtEndDate > now) { stErrorMessage += "End Date can only be dates before today. \n" }
        }

        if(stErrorMessage != '') {
            alert(stErrorMessage);
            return false;
        }

        return true;
    }

    function getFormattedDate(stDate) {
        var month_names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        var month_names_short = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var objMonth = { 'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12 };

        switch(stDatePreference) {
            case 'M/D/YYYY':
            case 'MM/DD/YYYY':
                var arrDate = stDate.split('/');
                var strdate = new Date(arrDate[0]+'/'+arrDate[1]+'/'+arrDate[2]);
                return strdate;
                // return Number(strdate.getMonth()+1) + '/' + strdate.getDate() + '/' + strdate.getFullYear();
                break;
            case 'D/M/YYYY':
            case 'DD/MM/YYYY':
                var arrDate = stDate.split('/');
                var strdate = new Date(arrDate[1]+'/'+arrDate[0]+'/'+arrDate[2]); //MM/DD/YYYY
                return strdate;
                // return strdate.getDate() + '/' +Number(strdate.getMonth()+1) + '/' + strdate.getFullYear();
                break;
            case 'D-Mon-YYYY':
            case 'DD-Mon-YYYY':
                var arrDate = stDate.split('-');
                var strdate = new Date(objMonth[arrDate[1]]+'/'+arrDate[0]+'/'+arrDate[2]); //MM/DD/YYYY
                return strdate;
                // return strdate.getDate() + '-' +month_names_short[strdate.getMonth()] + '-' + strdate.getFullYear();
                break;
            case 'D.M.YYYY':
            case 'DD.MM.YYYY':
                var arrDate = stDate.split('.');
                var strdate = new Date(arrDate[1]+'/'+arrDate[0]+'/'+arrDate[2]); //MM/DD/YYYY
                return strdate;
                // return strdate.getDate() + '.' +Number(strdate.getMonth()+1) + '.' + strdate.getFullYear();
                break;
            case 'D-MONTH-YYYY':
            case 'DD-MONTH-YYYY':
                var strdate = new Date(stDate); //MM/DD/YYYY
                return strdate;
                // return strdate.getDate() + '-' +month_names[strdate.getMonth()] + '-' + strdate.getFullYear();
                break;
            case 'D MONTH, YYYY':
            case 'DD MONTH, YYYY':
                var strdate = new Date(stDate); //MM/DD/YYYY
                return strdate;
                // return strdate.getDate() + ' ' +month_names[strdate.getMonth()] + ', ' + strdate.getFullYear();
                break;
            case 'YYYY/M/D':
            case 'YYYY/MM/DD':
                var arrDate = stDate.split('/');
                var strdate = new Date(arrDate[1]+'/'+arrDate[2]+'/'+arrDate[0]); //MM/DD/YYYY
                return strdate;
                // return strdate.getFullYear() + '/' + Number(strdate.getMonth()+1) + '/' + strdate.getDate();
                break;
            case 'YYYY-M-D':
            case 'YYYY-MM-DD':
                var arrDate = stDate.split('-');
                var strdate = new Date(arrDate[1]+'/'+arrDate[2]+'/'+arrDate[0]); //MM/DD/YYYY
                return strdate;
                // return strdate.getFullYear() + '-' + Number(strdate.getMonth()+1) + '-' + strdate.getDate();
                break;
        }
    }

    return { saveRecord: saveRecord };
});