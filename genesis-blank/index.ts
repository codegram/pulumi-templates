import { k8s, pulumi, docker } from "@codegram/pulumi-utils";

/**
 * Get a reference to the stack that was used to create
 * the genesis Kubernetes cluster. In order to make it work you need to add
 * the `clusterStackRef` config value like this:
 *
 * $ pulumi config set clusterStackRef codegram/genesis-cluster/prod
 */
const stackReference = pulumi.getStackReference({
  name: pulumi.getValueFromConfig("clusterStackRef"),
});

/**
 * Create a Kubernetes provider that will be used by all resources. This function
 * uses the previous `stackReference` outputs to create the provider for the
 * Genesis Kubernetes cluster.
 */
const kubernetesProvider = k8s.buildProvider({
  name: "${PROJECT}",
  kubeconfig: stackReference.requireOutput("kubeconfig"),
  namespace: stackReference.requireOutput("appsNamespaceName"),
});

/**
 * Create a new docker image. Use the `context` option to specify where
 * the `Dockerfile`is located.
 *
 * NOTE: to make this code work you need to add the following config value:
 *
 * $ pulumi config set gcpProjectId labs-260007
 *
 * The reason for that is we are pushing the docker images to Google cloud right now.
 */
const dockerImage = docker.buildImage({
  name: "${PROJECT}",
  context: ".",
});

/**
 * Create a Kubernetes application using the previous docker image. Change the `port` and
 * `replicas` to match your needs.
 *
 * This function creates a `Deployment`, `Service` and `Ingress` objects. The application
 * will be accessible in ${PROJECT}.codegram.io"
 */
k8s.createApplication({
  name: "${PROJECT}",
  deploymentOptions: {
    host: "${PROJECT}.codegram.io",
    port: 3000,
    replicas: 1,
  },
  dockerImageName: dockerImage.imageName,
  provider: kubernetesProvider,
});
