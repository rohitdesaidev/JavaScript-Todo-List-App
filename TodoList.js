jQuery(document).ready(function($){

	var database;

	var openRequest = indexedDB.open('TODO', 1);

	openRequest.onupgradeneeded = function(e)
	{
		var thisDB = e.target.result;
		if(!thisDB.objectStoreNames.contains('todolist')) 
		{
			thisDB.createObjectStore('todolist', { autoIncrement : true });
		}
	};

	openRequest.onsuccess = function(e)
	{
		console.log('Open Success!');
		db = e.target.result;
		$('#save-btn').click(function(e)
		{
			var subjectText = $('<div />').text($('#subject').val()).html();
			var authorText = $('<div />').text($('#author').val()).html();
			var messageText = $('<div />').text($('#message').val()).html();
			var timest = new Date(Date.now());
			if (!subjectText.trim()) 
			{
				alert('Subject is Required');
			} else if (!authorText.trim()) 
			{
				alert('Author is Required');
			}else if (!messageText.trim()) 
			{
				alert('Message is Required');
			}else 
			{
				addNote(new TodoList(subjectText, authorText,messageText,timest));
				$('#note-form').toggle();
				$('#subject').val('');
				$('#author').val('');
				$('#message').val('');

			}
		});
		renderList();
	};


	openRequest.onerror = function(e) {
		console.dir(e);
	}


	$('#new-btn').click(function(e){
		$('#note-form').toggle();
	});

	function addNote(todolist)
	{
		console.log('adding ' + todolist.fullname);
		var transaction = db.transaction(['todolist'],'readwrite');
		var store = transaction.objectStore('todolist');
		var addRequest = store.add(todolist);

		addRequest.onerror = function(e) 
		{
			console.log("Error", e.target.error.name);
	        
	    }
	    addRequest.onsuccess = function(e) 
	    {
	    	console.log("added " + todolist.subject);
	    	$('#subject').val('');
			$('#author').val('');
			$('#message').val('');
	    	renderList();   	
	    }
	} //end addNote()

	function renderList()
	{
		$('#list-panel').empty();
		
		var transaction = db.transaction(['todolist'], 'readonly');
		var store = transaction.objectStore('todolist');
		var countRequest = store.count();
		
		countRequest.onsuccess = function()
		{
		$('#list-panel').html('<h2>Total Notes: '+countRequest.result+'</h2>');
		$('#list-panel').append('<h4>Click on notes subject for detail view of todo note.</h4>');
		$('#list-panel').append('<table class="table table-bordered"> <tr class="bg-info"><th> No. </th><th> Subject </th><th> Character Count </th><th> Date Modified </th></tr> </thead></table>');

			//console.log(countRequest.result)
			var count = Number(countRequest.result);
			var counter = 0;
			
			if (count > 0) 
			{
				var objectStore = db.transaction(['todolist'], 'readonly').objectStore('todolist');
				objectStore.openCursor().onsuccess = function(e)
				{
					var cursor = e.target.result;
					if (cursor) 
					{
						counter++;
						var $row = $('<tr>');
						var $keyCell = $('<td>' + counter+ '</td>');
						var $subcell = $('<a href="#" data-key="' + cursor.key + '">' +(cursor.value.subject).substring(0,25)+"..." + '</a>');
						$subcell.click(function()
						{
							//alert('Clicked ' + $(this).attr('data-key'));
							loadlistbykey(Number($(this).attr('data-key')));
						});
						var $nameCell = $('<td></td>').append($subcell);
						var messageContent = cursor.value.message;
						var $charcount=0;

						var regx = /[a-z0-9]/gi;
						var match = messageContent.match(regx);
						if (match) 
						{
  							console.log(match.length);
  							charcount =match.length;
						}



						var $CountCell = $('<td>' + charcount+ '</td>');
						var $time = $('<td></td>').append(cursor.value.timestamp.toLocaleString('en-US'));
						$row.append($keyCell);
						$row.append($nameCell);
						$row.append($CountCell);
						$row.append($time);
						$('#list-panel table').append($row);
						cursor.continue();
					}
					else {
					    // no more entries
					}
				};
			} else {
				$('#list-panel').empty();
				$('#list-panel').html('<h3>No Notes to show!</h3>');
				}
		};
	} 

	function loadlistbykey(k)
	{
		var transaction = db.transaction(['todolist'], 'readonly');
		var store = transaction.objectStore('todolist');
		var request = store.get(k);

		request.onerror = function(e) 
		{
		  // Handle errors!
		};
		request.onsuccess = function(e) 
		{
			$('#detail').html('<br><h2 class = detail >Todo Details</h2>');
			$('#detail').append($('<div class = "detail1"><label>Subject: &ensp;<input type="text" id="subject-detail" value="' + request.result.subject + '"></label></div>'));
			$('#detail').append($('<label class = "detail1"> &ensp; Date: ' + request.result.timestamp.toLocaleString('en-US') + '</label><br><br>'));
			
			$('#detail').append($('<div class = "detail1"><label>Author:&ensp; <input type="text" id="author-detail" value="' + request.result.author + '"></label></div><br><br>'));
			
			$('#detail').append($('<div class = "detail1"><label>Message: </label><br><textarea id ="message-detail" rows="4" cols="50" name="comment" form="usrform"> '+ request.result.message + '</textarea></div><br><br>'));
			var $delBtn = $('<div class = "delete-button"><button class="btn btn-danger">Delete Note</button></div>');
			$delBtn.click(function()
			{
		   		console.log('Delete ' + k);
		   		deleteNote(k);
			});
			var $saveBtn = $('<div class = "save-button"><button class="btn btn-success">Save Changes</button></div>');
			$saveBtn.click(function()
			{
				console.log('update ' + k);
				updateNote(k);
			});
			$('#detail').append($delBtn);
			$('#detail').append($saveBtn);
			if($('#note-form').is(":visible"))
			{
				$('#note-form').hide();
			}
			$('#detail').show();
		};
	} 
// delete by key
	function deleteNote(k) 
	{
		var transaction = db.transaction(['todolist'], 'readwrite');
		var store = transaction.objectStore('todolist');
		var request = store.delete(k);
		request.onsuccess = function(e){
			renderList();
			$('#detail').empty();
			$('#detail').hide();
		};
	} // end deleteContact()

	// update contact
	function updateNote(k) 
	{


		var subjectText = $('<div />').text($('#subject-detail').val()).html(); 
		var authorText = $('<div />').text($('#author-detail').val()).html();  
		var messageText = $('<div />').text($('#message-detail').val()).html();
		var timest = new Date(Date.now());
		if (!subjectText.trim()) 
		{
			alert('Subject is Required');
		} else if (!authorText.trim()) 
		{
			alert('Author is Required');
		} else if (!messageText.trim()) 
		{
				alert('Message is Required!');
		}else 
		{
			var note = new TodoList(subjectText, authorText,messageText,timest);
			var transaction = db.transaction(['todolist'], 'readwrite');
			var store = transaction.objectStore('todolist');
			var request = store.put(note, k);
			renderList();
			$('#detail').empty();
			$('#detail').hide();
		}
	} // end updateContact()

	function TodoList(subject, author,message,timestamp){
		this.subject = subject;
		this.author = author;
		this.message = message;
		this.timestamp =timestamp;
	}

});