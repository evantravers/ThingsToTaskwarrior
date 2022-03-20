# Things To Taskwarrior

**This script is rough and mostly for hacker/developers to play with.**

Goes through all your Things 3 todos and generates a file of JSON objects for
Taskwarrior to import.

## Features:

- Includes Areas and Projects as "dot notation" projects
- Imports Due dates and "When" as "Scheduled"
- Includes tags
- Imports your Todos notes as Annotations

## Limitations:

- Things's API doesn't surface repeating dates, so those aren't implemented

To run:

```bash
osascript things-to-taskwarrior.js
```

You'll probably be prompted to give your terminal permission to run
automations. There is screen-scraping to pull out checklists out of To-dos, you
can comment out that code if you don't care.
