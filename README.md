JM_inf5750
==========

Open Source (inf5750) project, Data Element Bulk Editor

[Trello](https://trello.com/b/Ty2kBdZY/utvikling)
[Wiki](https://wiki.uio.no/mn/ifi/inf5750/index.php/Main_Page)
[Git](https://github.com/s176251/JM_inf5750)
[Groups](https://docs.google.com/spreadsheets/d/1wJ_RNi7ztY2xFRP-m5iqSaajG1KR_neET_R2jlpNmj4/pubhtml)
[Group Server](http://inf5750-12.uio.no/)
[DHIS2 Documentation](https://www.dhis2.org/doc/snapshot/en/developer/html/dhis2_developer_manual.html)


TODO: 
For better performance everything in the "panel-body" (line 92 in index.html, which is repeated for every element) should be set/initiated when showDataElement() is called.
This isn't a big issue when less than 30/40 elements is returned, but causes the page to freeze for up to a minute when > 400 elements is displayed.
Unfortunately this fell outside the scope of our assignment, but should be the first priority for any further development.