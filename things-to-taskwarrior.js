(function() {
  var Things = Application("Things");
  var se = Application('System Events')
  app = Application.currentApplication()
  app.includeStandardAdditions = true;

  // Things doesn't give access to a Checklist for a To-do, so I'm scraping the
  // screen for it. :P
  const processChecklist = function(task, toDo) {
    app.setTheClipboardTo("[NONE]")

    Things.activate()
    Things.show(toDo)

    delay(.1)
    se.keystroke('c', { using: [ 'command down' ] }) // boy this is nasty
    delay(.1)

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

    if (str != "") { addAnnotation(task, "Checklist:\n" + str) }
  }

  const ISOdate = function(date) {
    // YYYYMMDDTHHMMSSZ
    return `${date.getUTCFullYear()}${(date.getUTCMonth() + 1).toString().padStart(2, '0')}${date.getUTCDate().toString().padStart(2, '0')}T${date.getUTCHours().toString().padStart(2, '0')}${date.getUTCMinutes().toString().padStart(2, '0')}${date.getUTCSeconds().toString().padStart(2, '0')}Z`
  }

  const stringToUuid = (str) => {
    str = str.replace('-', '');
    return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/[x]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }

  // Things 3 is more forgiving when it comes to tag and project names than
  // TaskWarrior. This makes most strings TaskWarrior/file-safe.
  const safe = function(str) {
    return str
      .replace(/Rituals: /g, '')
      .replace(/@/g, '')
      .replace(/ /g, '')
      // replace nonstandard characters with "_", avoid double "__", trim start
      // and end of string
      .replace(/[^a-zA-Z0-9_@.]/g, '_')
      .replace(/__/g, '_')
      .replace(/^_/g, '')
      .replace(/_$/g, '')
  }

  const computeTag = function(tags, tag) {
    if (tag.parentTag()) { return `${computeTag(tags, tag.parentTag())}.${safe(tag.name())}`; }

    return safe(tag.name());
  }

  const addTags = function(task, toDo) {
    let tags = [];

    if (toDo.tags().length > 0) {
      toDo.tags().forEach(tag => tags.push(computeTag(tags, tag)))
    }

    if (tags.length > 0) { task.tags = tags };
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

    task.project = `${safe(area)}${dot}${safe(project)}`
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

    let Someday = Things.lists.byId("TMSomedayListSource").toDos().map(t => t.id());
    if (Someday.find(id => id == toDo.id())) {
      task.status = "waiting"
      // wait a year arbitrarily
      task.wait   = ISOdate(new Date(new Date().setFullYear(new Date().getFullYear() + 1)))
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
