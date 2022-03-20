(function() {
  var Things = Application("Things");
  var se = Application('System Events')
  app = Application.currentApplication()
  app.includeStandardAdditions = true;

  var Someday = Things.lists.byId("TMSomedayListSource").toDos().map(t => t.id());

  let days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  let _cleanTag = function(tagString) {
    return tagString.replaceAll(/[^a-zA-Z0-9_@]/g, '_')
                    .replaceAll(/__/g, '_')
                    .replace(/^_/g, '')
                    .replace(/_$/g, '')
  }

  var TagGroups = (function() {
    let tags = [];
    Things.tags().forEach(function(t) {
      if (t.tags().length > 0) {
        tags.push([_cleanTag(t.name()), t.tags().map(t => _cleanTag(t.name()))])
      }
    });
    return tags;
  })();

  let Tag = function(obj) {
    let hasTags = obj.tagNames() !== "";
    if (!hasTags) { return '' }
    let tags = obj.tagNames()
                .split(',')
                .map(_cleanTag)

    if (Someday.includes(obj.id())) {
      tags.push("Someday")
    }

    return `:${tags.join(":")}:`;
  }

  let Date = function(d) {
    return `${d.getFullYear()}-${((d.getMonth()+1).toString()).padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  }

  let _getDate = function(obj, str, call) {
    let d = obj[call]();
    if (d) {
      let date = Date(d);
      return `${str}: <${date} ${days[d.getDay()]}>`;
    }
    else {
      return null;
    }
  }

  let Due = function(obj) { return _getDate(obj, 'DEADLINE', 'dueDate') }
  let Scheduled = function(obj) { return _getDate(obj, 'SCHEDULED', 'activationDate') }

  let Attributes = function(obj, opts = {indent: 0}) {
    let heading = `${obj.name()} ${Tag(obj)}`;
    let body = ["\n", Scheduled(obj), Due(obj), obj.notes()]
               .filter(o => o != null)
               .map(s => s.split("\n").map(l => l.padStart(l.length + opts.indent, " ")).join("\n").trimEnd())
               .join("\n")
               .trimEnd();

    if (body.length > 1) {
      return heading + body;
    }
    else {
      return heading;
    }
  }

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

  let Todo = function(todo) {
    let checklist = scrapeChecklist(todo);

    return `*** TODO ${Attributes(todo, {indent: 4})}${checklist}\n`;
  }

  let Proj = function(project) {
    let temp = `** ${Attributes(project, {indent: 3})}\n`;
    for (todo of project.toDos()) {
      temp += Todo(todo);
    }
    return temp;
  };

  Things.launch();

  // Export Inbox
  let inbox = "* Inbox\n\n";

  TagGroups.forEach(function([group, members]) {
    inbox += `#+TAGS: [ ${group} : ${members.join(' ')} ]\n`;
  });

  inbox += "\n"

  for (todo of Things.lists.byId("TMInboxListSource").toDos()) {
    inbox += Todo(todo)
  }
  app.doShellScript(`echo "${inbox}" > "\${HOME}/Dropbox/org/Inbox.org"`);

  // Export Areas
  for (area of Things.areas()) {
    let orgfile = `* ${area.name()} ${Tag(area)}\n`;

    // Gather Projects
    let projects = [];
    for (proj of Things.projects().filter(t => t.area() && t.area().id() == area.id() && t.status() == "open")) {
      projects.push(proj)
    }

    // Add To-dos without Projects
    orgfile = orgfile + "** Inbox\n";
    for (todo of area.toDos().filter(t => !projects.some(p => t.id() == p.id()) && t.status() == 'open' && t.project() == null)) {
      orgfile += Todo(todo)
    }

    // Iterate the Projects
    for (proj of projects) {
      orgfile += Proj(proj);
    }

    app.doShellScript(`echo "${orgfile}" > "\${HOME}/Dropbox/org/${area.name()}.org"`);
  }
})();
