This directory will need to be populated with the static files containing user
data. When this data is obtained, extract and place each CSV and JSON file in
this directory. After that, run the following command to rebuild the project:

```
npm run build ; npm start
```

These files should now be visible in the directory ```../dist/data```, as they
were copied there during the build process.
