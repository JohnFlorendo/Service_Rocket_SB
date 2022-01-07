define([],

    function () {
        var libFieldMapping = {};

        libFieldMapping.invoiceSummaryFields = [
            {
                id: 'custpage_amt_of_so_before',
                type: 'CURRENCY',
                label: 'SO Amount (before tax)',
                container: 'custpage_tabinvoicesummary',
                displayType: 'INLINE',
                breakType: 'NONE'
            },
            {
                id: 'custpage_tax_amt_so',
                type: 'CURRENCY',
                label: 'SO Tax Amount',
                container: 'custpage_tabinvoicesummary',
                displayType: 'INLINE',
                breakType: 'NONE'
            },
            {
                id: 'custpage_total_amt_so',
                type: 'CURRENCY',
                label: 'Total Sales Order',
                container: 'custpage_tabinvoicesummary',
                displayType: 'INLINE',
                breakType: 'NONE'
            },
            {
                id: 'custpage_amt_invoiced_before',
                type: 'CURRENCY',
                label: 'Invoiced Amount (before tax)',
                container: 'custpage_tabinvoicesummary',
                displayType: 'INLINE',
                breakType: 'STARTCOL'
            },
            {
                id: 'custpage_tax_amt_inv',
                type: 'CURRENCY',
                label: 'Invoiced Tax Amount',
                container: 'custpage_tabinvoicesummary',
                displayType: 'INLINE',
                breakType: 'NONE'
            },
            {
                id: 'custpage_total_amt_inv',
                type: 'CURRENCY',
                label: 'Total Invoice',
                container: 'custpage_tabinvoicesummary',
                displayType: 'INLINE',
                breakType: 'NONE'
            },
            {
                id: 'custpage_amt_remaining',
                type: 'CURRENCY',
                label: 'Remaining Amount',
                container: 'custpage_tabinvoicesummary',
                displayType: 'INLINE',
                breakType: 'STARTCOL'
            },
            {
                id: 'custpage_tax_amt_remaining',
                type: 'CURRENCY',
                label: 'Remaining Tax Amount',
                container: 'custpage_tabinvoicesummary',
                displayType: 'INLINE',
                breakType: 'NONE'
            },
            {
                id: 'custpage_amt_remaining_last',
                type: 'CURRENCY',
                label: 'Total Remaining Amount',
                container: 'custpage_tabinvoicesummary',
                displayType: 'INLINE',
                breakType: 'NONE'
            }
        ]

        return libFieldMapping;

    });
