# VSCode - Inline as Data URI
HTML allows to not only specify what image should be displayed using a url but also to inline the actual image data
into the page's html as a data uri. This is usually done to optimize the loading of your web page since additional
server round-trips are avoided.

This Visual Studio Code extension simplifies the inlining process. Simply select the value of the src attribute of
an img element on a html page (html, jade, other templates) and select 'Inline as Data URI' from the Command Pallette.

## License
MIT