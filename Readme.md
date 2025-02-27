#Execute APP and generate the output log in a file
npm run dev 2>&1 | tee temp/output.log
