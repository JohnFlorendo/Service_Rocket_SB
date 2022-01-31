define(['./lib/atlinvoice', './lib/invoice'],

function(atlinvoice, invoice) {
   
	
	generate = 
		
	function (option) {

		var sTemplate = '';
		
		if(option.getValue('class') == 90){ //Resell
			sTemplate = atlinvoice.generate(option); 
		}
		else if(option.getValue('subsidiary') == 15){
			
		}
		else{
			sTemplate = invoice.generate(option); 
		}
		
		return sTemplate;
		
	};
	
    return {
    	generate: generate
    };
    
});