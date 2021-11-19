@uglifyjs gobang.js --source-map -c unsafe,passes=2 -m toplevel,properties,reserved=['loadGobangGame',{}] -b beautify=false,quote_style=1 -o gobang.min.js
