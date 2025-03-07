#Execute APP and generate the output log in a file
npm run dev 2>&1 | tee temp/output.log

#Execute on Render
See logs and settings from: https://dashboard.render.com/ (barbi09 Github user)
Execute: https://yaml-lint-api.onrender.com

#Docker
Build: docker build -t yaml-lint-api .
Run it: docker run -it -p 8080:8080 yaml-lint-api
