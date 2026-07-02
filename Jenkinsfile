pipeline {
    agent any


    stages {
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }
        stage('Generate Prisma client') {
            steps {
                sh 'npm run prisma:generate'
            }
        }
        stage('Run Tests unit and coverage') {
            steps {
                sh 'npm run test && npm run test:coverage'
            }
        }
        stage('Run Tests e2e and coverage') {
            steps {
                sh 'npm run test:e2e && npm run test:e2e:coverage'
            }
        }
        stage('Publish tests on Jenkins') {
            steps {
                junit '**/reports/junit.xml'
            }
        }
        stage('Analysis with SonarQube') {
            steps {
                withSonarQubeEnv('sonar-qube') {
                    sh 'npm run sonar:scan'
                }
            }
        }
        stage('Build Docker image') {
            steps {
                sh 'docker build -t cicd-tasklist-backend .'
            }
        }
        stage('Scan image with Trivy') {
            steps {
                sh 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image cicd-tasklist-backend'
            }
        }
        stage('Generate SBOM with Trivy') {
            steps {
                sh 'mkdir -p reports'
               sh 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest -q image --format cyclonedx cicd-tasklist-backend > reports/sbom.json'
            }
        }
        stage('Push Docker image to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'emmanuelle-curiant-dockerhub-password', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                    sh 'echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin'
                    sh 'docker tag cicd-tasklist-backend $DOCKER_USERNAME/cicd-tasklist-backend:latest'
                    sh 'docker push $DOCKER_USERNAME/cicd-tasklist-backend:latest'
                }
            }
        }
    }    
    post {
        always {
            cleanWs()
        }
    }
}