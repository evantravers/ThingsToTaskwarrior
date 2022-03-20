(function() {
  var Things = Application("Things");
  var se = Application('System Events')
  app = Application.currentApplication()
  app.includeStandardAdditions = true;

  var Someday = Things.lists.byId("TMSomedayListSource").toDos().map(t => t.id());

  // Things doesn't give access to a Checklist for a To-do, so I'm scraping the
  // screen for it. :P
  let scrapeChecklist = function(todo) {
    app.setTheClipboardTo("[NONE]")

    Things.activate()
    Things.show(todo)

    delay(.1)
    se.keystroke('c', { using: [ 'command down' ] }) // boy this is nasty
    delay(.1)

   let str = app.theClipboard()
      .replaceAll(/\r/g, "\n")
      .split(/\n/)
      .filter(function(line) {
        if (line.match(/^- /m)) {
          return true;
        }
        return false;
      })
      .map(l => l.replace(/^- /, '    - [ ] '))
      .join("\n");

    if (str.length > 1) {
      return "\n\n" + str;
    }
    else {
      return '';
    }
  }

  const ISOdate = function(date) {
    // YYYYMMDDTHHMMSSZ
    return `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}T${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}${date.getSeconds().toString().padStart(2, '0')}Z`
  }

  const stringToUuid = (str) => {
    str = str.replace('-', '');
    return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/[x]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }

  const addTags = function(task, toDo) {
    if (toDo.tagNames()) {
      task.tags = toDo.tagNames().split(", ")
    }
  }

  const addAnnotations = function(task, toDo) {
    if (toDo.notes() != "") {
      task.annotation = [toDo.notes()]
    }
  }

  const writeTextToFile = function(text, file) {
    try {

      // Convert the file to a string
      // var fileString = file.toString()
      var str = $.NSString.alloc.initWithUTF8String(text);
      str.writeToFileAtomicallyEncodingError(file, true, $.NSUTF8StringEncoding, null)

      // Return a boolean indicating that writing was successful
      return true
    }
    catch(error) {
      // Return a boolean indicating that writing was successful
      return false
    }
  }

  Things.launch();

  let tasks = [];

  Things.toDos().forEach(function(toDo) {
    let task = {
      uuid: stringToUuid(toDo.id()),
      entry: ISOdate(toDo.creationDate()),
      description: toDo.name(),
      status: "pending"
    }

    addTags(task, toDo)
    addAnnotations(task, toDo)

    tasks.push(task)
  })

  writeTextToFile(tasks.map(t => JSON.stringify(t)).join("\n"), "tasks.json")
})();
