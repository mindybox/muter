var TIMEOUT_SEC = 8; 
var INTERVAL_MILISEC = 100;
var NAMESPACE = "muterextension";

//memory
var currInterval = 0;
var isStandby = false;
var intervalObj;
var userData = {};

var memory = {};

// load from storage
chrome.storage.sync.get(['DA'], function(data) {
	if(typeof data == undefined || Object.keys(data).length === 0){
	  //no users recorded
	} else {
    userData = data.DA;
	}
});



$(document).ready(function(){
	//find text? No too expensive
	var doc = $(document);
	console.warn("Muter is Ready. Standby.");

	intervalObj = window.setInterval(checkDOM, INTERVAL_MILISEC);
	isStandby = true;

});


function checkDOM() {
	if($(document).find(".sender").length > 0){
	  muteUser();
	  clearInterval(intervalObj);
	}

	currInterval+= INTERVAL_MILISEC;
	if(currInterval>=TIMEOUT_SEC*1000){
		clearInterval(intervalObj);
		isStandby = false;
	}
}

function checkDOM_byProp() {

	currInterval+= INTERVAL_MILISEC;
	if(currInterval>=TIMEOUT_SEC*1000){
		clearInterval(intervalObj);
		isStandby = false;

		return;
	}
  
  if (memory.hasOwnProperty("oldNoteId")){
  	var currNoteDOM = $(document).find("#current-note").eq(0);
  	var currNoteId = currNoteDOM.find("form").eq(0).children('input[name="noteids[]"]').attr("value");
  	if (currNoteId && currNoteId == memory["oldNoteId"]){
  		console.warn("MATCH VALIDATED");

  		// unblur the pre-blur
  		cssBlur($(document).find(".notes-right"), "0");

  		// blur message
  		cssBlur(currNoteDOM.find(".mcb-body.wrap-text").eq(0), "4");

  		// hide reply box
  		var replyBox = $(document).find(".notes-right").children(".push.compose_frame").eq(0);
  		if (replyBox.length < 1){return;}

  		var replyShowButton = $('<a href="#" id="'+NAMESPACE+'_show_reply">Show reply box</a>');
  		replyBox.parent().find("#"+NAMESPACE+"_show_reply").remove();
  		replyShowButton.insertBefore(replyBox);

  		// hide
  		replyBox.css("display", "none"); 
  		// show
  		replyShowButton.click(function(e){
  			e.preventDefault();
  			replyBox.css("display", ""); 
  			$(this).remove();
  		});


  		clearInterval(intervalObj);
  	}
  } else {
  	clearInterval(intervalObj);
  }

}


function muteUser(targetUsername) {
  
  if (targetUsername == undefined || typeof targetUsername == undefined){
  	// ghost ALL users

  	//hard coded user
		var usernameMatch = "dustytired2";

		$(document).find(".sender").each(function(){

			$(this).find(".username").each(function(){

				var usernameText = $(this).text().toLowerCase();
				
				// check against each stored user
				for (var un in userData) {
			    if (usernameText == un.toLowerCase()){
			    	cssBlur($(this).parentsUntil(".note").find('.note-preview'), "4");
			    	
			    	//flag the link
			    	memory["mutedClassName"] = NAMESPACE+"_muted_user";
			    	$(this).closest("li").addClass(memory["mutedClassName"] );

			    }
			  } // end: for()

				

			});
		}); //end: $(document).find()
  
  } else {
  	// ghost targetted user
  	$(document).find(".sender").each(function(){

  		var usernameText = $(this).find(".username").text().toLowerCase();

  		if(usernameText.indexOf(targetUsername.toLowerCase())>=0){
  			cssBlur($(this).parentsUntil(".note").find('.note-preview'), "4");
  		}
  		  	
  	});
  }
  
}

function cssBlur($target, magnitude){
	magnitude = magnitude || "3";
	magnitude = magnitude.toString();

	$target.css("filter", "blur("+magnitude+"px)");
}

function ghostUserDOM(){

}

/* ------------------------------- */
/* ------------------------------- */
//           LISTENERS
/* ------------------------------- */
/* ------------------------------- */

chrome.storage.onChanged.addListener(function(changes, namespace) {
  for (key in changes) {
    var storageChange = changes[key];
    console.warn('Storage key "%s" in namespace "%s" changed. ' +
                'Old value was "%s", new value is "%s".',
                key,
                namespace,
                storageChange.oldValue,
                storageChange.newValue);

    //is the newValue going to contain that entire...yikes..
    var oldVal = storageChange.oldValue;
    var newVal = storageChange.newValue;
    if (newVal == undefined || typeof newVal == undefined || Object.keys(newVal) === 0){
    	console.warn("User list cleared.");
    	// TO DO: clear all effects
    
    } else {

			if (oldVal == undefined || typeof oldVal == undefined || Object.keys(oldVal) === 0){
				// Case 1: old value is empty. So all users are valid
			} else {
				// Case 2: old value is not empty. Find newly added users
				var oldKeys = Object.keys(oldVal);
				var newKeys = Object.keys(newVal);
				var newUsers = []; //any item in newKeys that is new 

				for(var i=0;i<newKeys.length;i++){
					if(oldKeys.indexOf(newKeys[i]) < 0){
						//it's new!
						newUsers.push(newKeys[i]);
					}
				}

				for(var i=0;i<newUsers.length;i++){
					console.warn("New user added: %s", newUsers[i]);
					//update ghosting
					muteUser(newUsers[i]);
				}
			}
    }
  } // end: for each key
});


document.addEventListener("click", function(e){
  var target = e.target || e.srcElement;

  // clear any blurs
  var noteContainer = $(document).find(".notes-right").eq(0);
  

  if (memory.hasOwnProperty("mutedClassName")){
  	if ($(target).closest("li").hasClass(memory["mutedClassName"])){
  		//user clicked note that has been flagged
  		console.warn("You clicked muted user's message!");
  		cssBlur(noteContainer);

  		// remember old Id
  		var noteId = $(target).closest("[data-noteid]").attr("data-noteid");
			noteId = noteId ? noteId : -1;
			memory["oldNoteId"] = noteId;

			if(noteId > 0){
			  currInterval = 0; //reset
			  intervalObj = window.setInterval(checkDOM_byProp, INTERVAL_MILISEC);
				isStandby = true;
			}

  	} else {
  		cssBlur(noteContainer, "0");
  	}

  }


  
});
