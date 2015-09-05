#minifies all js, then create a zip with all the needed files
#echoing the final file size

#minify and build zip
echo "starting build"
rm ReverseGroundBattle.zip
mkdir tmp
cd tmp
echo "minifying js"
curl -X POST -s --data-urlencode 'input@../source/game.js' http://javascript-minifier.com/raw > game.js
curl -X POST -s --data-urlencode 'input@../source/jallegro.js' http://javascript-minifier.com/raw > jallegro.js
curl -X POST -s --data-urlencode 'input@../source/jsfxr.js' http://javascript-minifier.com/raw > jsfxr.js

echo "copying"
cp ../source/index.html index.html

echo "zipping"
zip ../ReverseGroundBattle.zip game.js jallegro.js jsfxr.js index.html

echo "clearing"
cd ../
rm -rf tmp

echo "done"
echo "built file size:"
ls -la ReverseGroundBattle.zip | awk '{ print $5}'
ls -lah ReverseGroundBattle.zip | awk '{ print $5}'


