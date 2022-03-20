# Things To Orgmode

I'm playing around with the idea of switching to
[orgmode](https://orgmode.org/). In order to give that a whirl, I wrote a quick
script for exporting my active Things 3 tasks to .org files.

At the moment, it roughly recreates your active Things 3 Areas as .org files,
and Projects as Headings below that with notes, and Todos at level 3 inside the
Projects.

**This script is rough and mostly for hacker/developers to play with.**

To run:

```bash
osascript things-to-org.js
```

You'll probably be prompted to give your terminal permission to run
automations. There is screen-scraping to pull out checklists out of To-dos, you
can comment out that code if you don't care.
