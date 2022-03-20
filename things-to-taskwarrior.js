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

  const stringToUuid = (str) => {
    str = str.replace('-', '');
    return 'xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx'.replace(/[x]/g, function(c, p) {
      return str[p % str.length];
    });
  }

  Things.launch();

  let tasks =
    Things.toDos().map(toDo =>
      {
        uuid: stringToUuid(toDo.id())
        status: "pending"
        entry: toDo.creationDate()
        description: toDo.name()
      }
    )

  console.log(JSON.stringify(tasks))
})();
