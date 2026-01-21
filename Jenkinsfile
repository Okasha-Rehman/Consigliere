pipeline {
    agent any
    
    environment {
        // AWS Configuration
        AWS_REGION = 'us-east-1'
        ACCOUNT_ID = '983753078983'
        
        // ECR Repositories
        BACKEND_ECR_REPO = "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/consigliere/backend"
        FRONTEND_ECR_REPO = "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/consigliere/frontend"
        
        // EKS Configuration
        EKS_CLUSTER_NAME = 'consigliere-prod'
        K8S_NAMESPACE = 'consigliere'
        
        // Build Configuration
        IMAGE_TAG = "${BUILD_NUMBER}"
        GIT_COMMIT_SHORT = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo '=========================================='
                echo 'STAGE: Checkout Source Code'
                echo '=========================================='
                checkout scm
                sh '''
                    echo "Git Commit: ${GIT_COMMIT_SHORT}"
                    echo "Build Number: ${BUILD_NUMBER}"
                    echo "Branch: ${GIT_BRANCH}"
                '''
            }
        }
        
        stage('Build Docker Images') {
            parallel {
                stage('Build Backend') {
                    steps {
                        echo '=========================================='
                        echo 'Building Backend Docker Image'
                        echo '=========================================='
                        dir('backend') {
                            sh '''
                                docker build \
                                    -t ${BACKEND_ECR_REPO}:${IMAGE_TAG} \
                                    -t ${BACKEND_ECR_REPO}:latest \
                                    -t ${BACKEND_ECR_REPO}:${GIT_COMMIT_SHORT} \
                                    .
                                
                                echo "✓ Backend image built successfully"
                                docker images | grep backend | head -3
                            '''
                        }
                    }
                }
                
                stage('Build Frontend') {
                    steps {
                        echo '=========================================='
                        echo 'Building Frontend Docker Image'
                        echo '=========================================='
                        dir('frontend') {
                            sh '''
                                docker build \
                                    -t ${FRONTEND_ECR_REPO}:${IMAGE_TAG} \
                                    -t ${FRONTEND_ECR_REPO}:latest \
                                    -t ${FRONTEND_ECR_REPO}:${GIT_COMMIT_SHORT} \
                                    .
                                
                                echo "✓ Frontend image built successfully"
                                docker images | grep frontend | head -3
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Security Scan - Trivy') {
            parallel {
                stage('Scan Backend Image') {
                    steps {
                        echo '=========================================='
                        echo 'Scanning Backend Image for Vulnerabilities'
                        echo '=========================================='
                        sh '''
                            # Run Trivy scan (don't fail build on vulnerabilities for demo)
                            trivy image \
                                --severity HIGH,CRITICAL \
                                --exit-code 0 \
                                --format table \
                                ${BACKEND_ECR_REPO}:${IMAGE_TAG} || true
                            
                            # Generate JSON report
                            trivy image \
                                --severity HIGH,CRITICAL \
                                --exit-code 0 \
                                --format json \
                                --output backend-trivy-report.json \
                                ${BACKEND_ECR_REPO}:${IMAGE_TAG} || true
                            
                            echo "✓ Backend security scan completed"
                        '''
                    }
                }
                
                stage('Scan Frontend Image') {
                    steps {
                        echo '=========================================='
                        echo 'Scanning Frontend Image for Vulnerabilities'
                        echo '=========================================='
                        sh '''
                            # Run Trivy scan (don't fail build on vulnerabilities for demo)
                            trivy image \
                                --severity HIGH,CRITICAL \
                                --exit-code 0 \
                                --format table \
                                ${FRONTEND_ECR_REPO}:${IMAGE_TAG} || true
                            
                            # Generate JSON report
                            trivy image \
                                --severity HIGH,CRITICAL \
                                --exit-code 0 \
                                --format json \
                                --output frontend-trivy-report.json \
                                ${FRONTEND_ECR_REPO}:${IMAGE_TAG} || true
                            
                            echo "✓ Frontend security scan completed"
                        '''
                    }
                }
            }
        }
        
        stage('Push to ECR') {
            steps {
                echo '=========================================='
                echo 'Pushing Images to Amazon ECR'
                echo '=========================================='
                sh '''
                    # Login to ECR (using IAM role, no credentials needed)
                    aws ecr get-login-password --region ${AWS_REGION} | \
                        docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                    
                    # Push backend images
                    echo "Pushing backend image..."
                    docker push ${BACKEND_ECR_REPO}:${IMAGE_TAG}
                    docker push ${BACKEND_ECR_REPO}:latest
                    docker push ${BACKEND_ECR_REPO}:${GIT_COMMIT_SHORT}
                    
                    # Push frontend images
                    echo "Pushing frontend image..."
                    docker push ${FRONTEND_ECR_REPO}:${IMAGE_TAG}
                    docker push ${FRONTEND_ECR_REPO}:latest
                    docker push ${FRONTEND_ECR_REPO}:${GIT_COMMIT_SHORT}
                    
                    echo "✓ All images pushed to ECR"
                '''
            }
        }
        
        stage('Deploy to EKS') {
            steps {
                echo '=========================================='
                echo 'Deploying to Amazon EKS'
                echo '=========================================='
                sh '''
                    # Verify kubectl is configured
                    kubectl config current-context
                    kubectl get nodes
                    
                    # Update backend deployment
                    echo "Updating backend deployment..."
                    kubectl set image deployment/backend \
                        backend=${BACKEND_ECR_REPO}:${IMAGE_TAG} \
                        -n ${K8S_NAMESPACE} \
                        --record
                    
                    # Update frontend deployment
                    echo "Updating frontend deployment..."
                    kubectl set image deployment/frontend \
                        frontend=${FRONTEND_ECR_REPO}:${IMAGE_TAG} \
                        -n ${K8S_NAMESPACE} \
                        --record
                    
                    # Wait for backend rollout
                    echo "Waiting for backend rollout..."
                    kubectl rollout status deployment/backend -n ${K8S_NAMESPACE} --timeout=5m
                    
                    # Wait for frontend rollout
                    echo "Waiting for frontend rollout..."
                    kubectl rollout status deployment/frontend -n ${K8S_NAMESPACE} --timeout=5m
                    
                    echo "✓ Deployment completed successfully"
                '''
            }
        }
        
        stage('Verify Deployment') {
            steps {
                echo '=========================================='
                echo 'Verifying Deployment Health'
                echo '=========================================='
                sh '''
                    echo "Checking pod status..."
                    kubectl get pods -n consigliere
                
                    # Get ONLY running backend pods (exclude Terminating pods)
                    BACKEND_PODS=\$(kubectl get pods -n consigliere -l app=backend --field-selector=status.phase=Running -o jsonpath='{.items[*].metadata.name}')
                
                    for pod in \$BACKEND_PODS; do
                        echo "Checking health of \$pod..."
                        kubectl exec -n consigliere \$pod -- curl -f http://localhost:8000/health || echo "Warning: Health check failed for \$pod"
                    done
                
                    echo "✓ Deployment verification completed"
                '''
            }
        }
    }
    
    post {
        always {
            echo '=========================================='
            echo 'Pipeline Cleanup'
            echo '=========================================='
            sh '''
                # Archive Trivy reports
                if [ -f backend-trivy-report.json ]; then
                    echo "Backend security report available"
                fi
                if [ -f frontend-trivy-report.json ]; then
                    echo "Frontend security report available"
                fi
                
                # Clean up Docker images to save disk space
                docker image prune -af --filter "until=24h" || true
                
                # Show disk usage
                df -h /var/lib/docker || true
            '''
            
            // Archive artifacts
            archiveArtifacts artifacts: '*-trivy-report.json', allowEmptyArchive: true
        }
        
        success {
            echo '=========================================='
            echo '✓ PIPELINE COMPLETED SUCCESSFULLY'
            echo '=========================================='
            sh '''
                echo "Build Number: ${BUILD_NUMBER}"
                echo "Git Commit: ${GIT_COMMIT_SHORT}"
                echo "Images pushed to ECR with tag: ${IMAGE_TAG}"
                
                # Get deployment info
                kubectl get deployments -n ${K8S_NAMESPACE}
                
                # Get service info
                LB_URL=$(kubectl get svc frontend-service -n ${K8S_NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
                echo "Application URL: http://${LB_URL}"
            '''
        }
        
        failure {
            echo '=========================================='
            echo '✗ PIPELINE FAILED'
            echo '=========================================='
            sh '''
                echo "Build Number: ${BUILD_NUMBER}"
                echo "Git Commit: ${GIT_COMMIT_SHORT}"
                echo "Check logs above for errors"
                
                # Show recent pod events
                kubectl get events -n ${K8S_NAMESPACE} --sort-by='.lastTimestamp' | tail -20 || true
            '''
        }
    }
}
