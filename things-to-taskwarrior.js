(function() {
  var Things = Application("Things");
  var se = Application('System Events')
  app = Application.currentApplication()
  app.includeStandardAdditions = true;

  var Someday = Things.lists.byId("TMSomedayListSource").toDos().map(t => t.id());

  // Things doesn't give access to a Checklist for a To-do, so I'm scraping the
  // screen for it. :P
  const processChecklist = function(task, toDo) {
    app.setTheClipboardTo("[NONE]")

    Things.activate()
    Things.show(toDo)

    delay(.2)
    se.keystroke('c', { using: [ 'command down' ] }) // boy this is nasty
    delay(.2)

    let str =
    app.theClipboard()
    .replaceAll(/\r/g, "\n")
    .split(/\n/)
    .filter(function(line) {
      if (line.match(/^- \[ \]/m)) {
        return true;
      }
      return false;
    })
    .join("\n")

    if (str != "") { addAnnotation(task, str) }
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
    if (toDo.tagNames()) { task.tags = toDo.tagNames().split(", ") }
  }

  const addNotes = function(task, toDo) {
    if (toDo.notes() != "") { addAnnotation(task, toDo.notes()) }
  }

  const addAnnotation = function(task, annotation) {
    let obj = {
      entry: task.entry,
      description: annotation
    }

    if (task.annotations) { task.annotations.push(obj) }
    else { task.annotations = [obj]}
  }

  const addProject = function(task, toDo) {
    let project = "";
    let dot     = "";
    let area    = "";

    if (toDo.project()) {
      project = `${toDo.project().name()}`
    }
    if (toDo.project() && toDo.project().area()) {
      area = `${toDo.project().area().name()}`
    }
    if (project != "" && area != "") {
      dot = "."
    }

    task.project = `${area}${dot}${project}`
  }

  // https://taskwarrior.org/docs/using_dates.html#due
  const addDue = function(task, toDo) {
    if (toDo.dueDate()) { task.due = ISOdate(toDo.dueDate()) }
  }

  // I'm judging `scheduled` to be equivalent to `When` in Things 3. If you use
  // `When` to delay things till later, you'd want to map this to `wait` in
  // Taskwarrior.
  //
  // https://taskwarrior.org/docs/using_dates.html#scheduled
  // https://taskwarrior.org/docs/using_dates.html#wait
  const addScheduled = function(task, toDo) {
    if (toDo.activationDate()) {
      task.scheduled = ISOdate(toDo.activationDate())
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
    addNotes(task, toDo)
    addProject(task, toDo)

    processChecklist(task, toDo)

    addDue(task, toDo)
    addScheduled(task, toDo)

    tasks.push(task)
  })

  writeTextToFile(tasks.map(t => JSON.stringify(t)).join("\n"), "tasks.json")
  console.log("Now run: `task import tasks.json`")
})();
