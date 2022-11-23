for f in *.html
do
  aws s3 cp $f s3://$1/${f%%.*} --content-type "text/html" --content-encoding "utf8"
done

for f in *.js *.css
do
    aws s3 cp $f s3://$1/$f 
done
