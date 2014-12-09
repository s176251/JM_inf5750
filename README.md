JM_inf5750
==========

Open Source (inf5750) project, Data Element Bulk Editor

#### Links

* [Trello](https://trello.com/b/Ty2kBdZY/utvikling) (Used for collaboration and task backlog)
* [Wiki](https://wiki.uio.no/mn/ifi/inf5750/index.php/Main_Page) (Introduces the assignment and the group)
* [Git](https://github.com/s176251/JM_inf5750) (Contains source code)
* [Groups](https://docs.google.com/spreadsheets/d/1wJ_RNi7ztY2xFRP-m5iqSaajG1KR_neET_R2jlpNmj4/pubhtml) (List of groups)
* [Group Server](http://inf5750-12.uio.no/) (Group server were the webapp is uploaded)
* [DHIS2 Documentation](https://www.dhis2.org/doc/snapshot/en/developer/html/dhis2_developer_manual.html)
* [DataBulkEditor@DHIS2 Demo](https://apps.dhis2.org/apps/DataBulkEditor//index.html)
* [DataBulkEditor@DHIS2 Group12](http://inf5750-12.uio.no/apps/DataBulkEditor//index.html)

#### Members

* Martin WL
* Jonas M
* Sivert H

#### TODO: 
For better performance everything in the "panel-body" (line 92 in index.html, which is repeated for every element) should be set/initiated when showDataElement() is called.
This isn't a big issue when less than 30/40 elements is returned, but causes the page to freeze for up to a minute when > 400 elements is displayed.
Unfortunately this fell outside the scope of our assignment, but should be the first priority for any further development.